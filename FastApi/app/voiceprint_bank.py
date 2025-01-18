import time
import threading
import os, shutil, json
from typing import List
import numpy as np
import logging
import pickle
import faiss # type: ignore
from faster_whisper import WhisperModel # type: ignore
from datetime import datetime
import librosa
from scipy.spatial.distance import  cdist
from collections import defaultdict
from resemblyzer import preprocess_wav, VoiceEncoder # type: ignore
from sqlalchemy.exc import SQLAlchemyError # type: ignore
import librosa
from sqlalchemy.orm import Session # type: ignore
from . import models
from .clustering_strategy import DBSCANClustering, KMeansClustering


# Define class that contain the logic of processing files, clustering, indexing, and retrieve files

class VoicePrintThreads:
    
    def __init__(self,
                 db: Session, 
                 folder_path = "/home/lab/Desktop/PROJECT/FastApi/Files", 
                 done_folder_path = "/home/lab/Desktop/PROJECT/FastApi/Done",
                 search_folder_path = "/home/lab/Desktop/PROJECT/FastApi/Search",
                 error_folder_path = "/home/lab/Desktop/PROJECT/FastApi/Error",
                 voice_index_path = "speaker-data.index",
                 voice_index_cosine_path = "speaker-data-cosine.index",
                 ids_path = "ids.txt",
                 top_k = 10,
                 is_similarity = False,
                 reindexing_method='time',  # 'time' or 'file_count'
                 reindexing_value=30,  # time in minutes or number of files
                 maximum_number=20
                ):
        # Folder path details
        self.voice_index_path = voice_index_path
        self.voice_index_cosine_path = voice_index_cosine_path
        self.ids_path = ids_path
        self.folder_path = folder_path
        self.done_folder_path = done_folder_path
        self.search_folder_path = search_folder_path
        self.error_folder_path = error_folder_path
        self.top_k = top_k
        self.is_similarity = is_similarity 

        # Establish a connection to the Oracle database
        self.db = db

        # Init startup parameters
        self.index = None
        self.consine_index = None 
        self.runAllThreads = True
        self.IDs = None

        # Load index file if exist
        self.load_or_build_index(is_similarity)

        # Init a logger file
        self.logger = logging.getLogger('voiceprintBankLogger')
        handler = logging.FileHandler('voiceprintBank.log')
        formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

        # Init resemblyzer & faster whisper models (first to cpu and second to gpu because run both on the same computing unit is impossible)
        self.encoder = VoiceEncoder("cpu")
        self.model = WhisperModel("large-v2")

        # Initialize file processing counter
        self.file_counter = 0
        self.maximum_number = maximum_number
        # Set reindexing method and value
        self.reindexing_method = reindexing_method
        self.reindexing_value = reindexing_value

        # Set Threshold
        self.threshold = 100

        # Clusters Details
        self.centroid_files = None
        self.cluster_centroids = None

        # Threading event
        self.stop_event = threading.Event()
        
        
    def runThreads(self):
        print("runThreads")
        """
        "runThreads fnction.
        "we try to run all needed threads:
        "    - 1: first  thread: which listens to a specified folder and add the audio files to the database.
        "    - 2: second thread: which run every specified period (30 minutes) to rebuild the FAISS index.
        "    - 3: third  thread: which listens to a specified folder and look for similiar data.
        """
        # Create and start the threads
        self.src_thread = threading.Thread(target=self.listen_src_folder, args=[0])
        self.srh_thread = threading.Thread(target=self.listen_srh_folder)
        self.idx_thread = threading.Thread(target=self.enforceIndexing)        
        self.src_thread.start()
        self.srh_thread.start()
        self.idx_thread.start()

       

        self.src_thread.join()
        self.srh_thread.join()
        self.idx_thread.join()

    def stopThreads(self):
        print("Stopping threads...")
        
        # Signal threads to stop
        self.stop_event.set()
        self.runAllThreads = False

        # Wait for threads to finish
        if self.src_thread is not None:
            print("Joining source thread...")
            try:
                self.src_thread.join(timeout=10) 
                print("Source thread stopped.")
            except Exception as e:
                print(f"Error stopping source thread: {e}")

        if self.srh_thread is not None:
            print("Joining search thread...")
            try:
                self.srh_thread.join(timeout=10) 
                print("Search thread stopped.")
            except Exception as e:
                print(f"Error stopping search thread: {e}")

        if self.idx_thread is not None:
            print("Joining indexing thread...")
            try:
                self.idx_thread.join(timeout=10) 
                print("Indexing thread stopped.")
            except Exception as e:
                print(f"Error stopping indexing thread: {e}")

        # Reset threads to None after stopping
        self.src_thread = None
        self.srh_thread = None
        self.idx_thread = None

        print("All threads stopped successfully.")


    def listen_src_folder(self, ndx):
        while not self.stop_event.is_set() or self.runAllThreads:
            time.sleep(2)
            for file_name in os.listdir(self.folder_path):
                file_path = os.path.join(self.folder_path, file_name)
                self.audio_to_database(file_path)
    
    def extract_voiceprint(self, file_path):
        try:
            logging.info(f"Loading file: {file_path}")
            y, sr = librosa.load(file_path)
            logging.info(f"File loaded with sample rate: {sr}")
            wav_samples = librosa.resample(y, orig_sr=sr, target_sr=16000)
            wav = preprocess_wav(wav_samples)
            logging.info("Preprocessing done")
            voiceprint, _, _ = self.encoder.embed_utterance(wav, return_partials=True, rate=16, min_coverage=0.75)
            logging.info(f"Voiceprint extracted: {voiceprint}")
            return voiceprint
        except Exception as e:
            logging.error(f"Error extracting voiceprint from file: {file_path}")
            return None
        
    def speech_to_text(self, file_path):
        try:
            # (condition_on_previous_text=False) to avoid take the same context in processing new files 
            segments, info = self.model.transcribe(file_path, condition_on_previous_text=False)
            continuous_text = " ".join([segment.text for segment in segments])
            logging.info(f"Transcription: {continuous_text}")
            return continuous_text
        except Exception as e:
            logging.error(f"An error occurred during transcription: {e}")
            return ""
    
    def audio_to_database(self, file_path):
        noError = True
        file_name = os.path.basename(file_path)
        now = datetime.now()
        if file_path.lower().endswith('.wav'):
            try:
                features = self.extract_voiceprint(file_path)
                text = self.speech_to_text(file_path)
                if not text:
                    raise ValueError("Speech to text conversion failed, text is empty or None.")
                new_done_folder = self.done_folder_path + now.strftime("/%Y/%m/%d/%H")
                os.makedirs(new_done_folder, exist_ok = True)
                new_file_path = os.path.join(new_done_folder, file_name)
            except Exception as ex:
                noError = False
                new_Error_path = self.error_folder_path + now.strftime("/%Y/%m/%d/%H")
                os.makedirs(new_Error_path, exist_ok = True)
                try:
                    new_file_path = os.path.join(new_Error_path, file_name)
                    shutil.move(file_path, new_file_path)
                except Exception as exx:
                    self.logger.error('error loading from audio file: %s', repr(exx))
                    pass
                self.logger.error('error loading from audio file: %s. File name: %s', repr(ex), file_path)
                time.sleep(6)

            if noError:
                try:
                    voiceprint_list: List[float] = features.tolist()
                    self.add_record_to_database(file_path, voiceprint_list, text)
                    self.file_counter += 1
                    if self.reindexing_method == 'file_count' and self.file_counter >= self.reindexing_value:
                        self.enforceIndexing()
                except Exception as ex:
                    self.logger.error('error in adding record to database: %s', str(ex))


    def listen_srh_folder(self):
        while not self.stop_event.is_set() or self.runAllThreads:
            if self.IDs is not None and ((self.index is not None) or (self.cosine_index is not None)):
                # Iterate over each folder in the search_folder_path
                for folder_name in os.listdir(self.search_folder_path):
                    print(folder_name)
                    folder_path = os.path.join(self.search_folder_path, folder_name)

                    # Check if the current path is a directory
                    if os.path.isdir(folder_path):
                        output_data = {}

                        # Iterate over each wav file in the current folder
                        for file_name in os.listdir(folder_path):
                            if file_name.endswith('.wav'):
                                file_path = os.path.join(folder_path, file_name)
                                try:
                                    result, file_ids, file_names = self.query_audio_file(file_path, self.is_similarity)

                                    # Store the result in the output_data dictionary
                                    output_data[file_name] = {
                                        "file_name" : file_name,
                                        "result": result.tolist(), 
                                        "file_ids": file_ids,  
                                        "file_names": file_names
                                    }
                                except Exception as ex:
                                    self.logger.error(f"Error processing file {file_path}: {repr(ex)}")
                        
                        # Create a JSON file with the same name as the folder
                        json_file_path = os.path.join(folder_path, f"{folder_name}.json")
                        with open(json_file_path, 'w') as json_file:
                            json.dump(output_data, json_file, indent=4)

            time.sleep(10)
    
    def enforceIndexing(self):
        self.clustering(self.maximum_number)
        self.index_data_with_faiss()
        self.build_cosine_index_from_l2()
        self.file_counter = 0 
        if self.reindexing_method == 'time' and self.runAllThreads:
            self.start_timer()
    
    def start_timer(self):
        threading.Timer(self.reindexing_value * 60, self.enforceIndexing).start()

    def clustering(self, maximum_number):
        ids, file_names, sound_vectors = self.read_vectors_from_table()
        eps = 0.51
        min_samples = 2
        ep = 2*eps
        # Ensure sound_vectors is a NumPy array
        sound_vectors = np.asarray(sound_vectors)

        # Use DBSCAN to cluster the normalized vectors
        dbscan_strategy = DBSCANClustering(eps=eps, min_samples=min_samples, metric='euclidean')
        labels = dbscan_strategy.fit_predict(sound_vectors)
        
        # Make All Records  Un Active
        self.make_records_non_active()

        # Organize points by cluster and count points in each cluster
        clusters = defaultdict(list)
        cluster_sizes = defaultdict(int)
        cluster_files = defaultdict(list)
        cluster_ids = defaultdict(list)
        noise_ids = []
        noise_files = []
        cluster_centroids = {}
        centroid_files = {}
        for point, label, file_name, id in zip(sound_vectors, labels, file_names, ids):
            clusters[label].append(point)
            cluster_sizes[label] += 1
            if label == -1:
                noise_files.append(file_name)
                noise_ids.append(id)
            else:
                cluster_files[label].append(file_name) 
                cluster_ids[label].append(id)
        
        #Compute centroids using the method from DBSCANClustering
        centroids, centroid_files_array = dbscan_strategy.get_centroids(labels, sound_vectors, file_names)
        
        for label, centroid in enumerate(centroids):
            if label != -1:
                cluster_centroids[label] = centroid
                centroid_files[label] = centroid_files_array[label]

        # Handle noise points (label = -1)
        if noise_ids:
            try:
                self.update_is_index_for_closest_files(noise_ids)
            except Exception as e:
                print(f"Failed to update is_index for noise files: {e}")

        for label, points in clusters.items():
            if label == -1:
                continue

            points = np.array(points)
            files = np.array(cluster_files[label])
            ids = np.array(cluster_ids[label])

            if cluster_sizes[label] <= maximum_number:
                # If the cluster size is less than or equal to maximum_number, set all is_index = True
                try:
                    self.update_is_index_for_closest_files(ids)
                except Exception as e:
                    print(f"Failed to update is_index for all files in cluster {label}: {e}")
            elif maximum_number < cluster_sizes[label] <= self.threshold:
                # If the cluster size is between maximum_number and threshold, set is_index = True for closest maximum_number files
                distances = cdist([cluster_centroids[label]], points, metric='euclidean').flatten()
                closest_indices = np.argsort(distances)[:maximum_number]
                closest_files = files[closest_indices]
                closest_ids = ids[closest_indices]
                try:
                    self.update_is_index_for_closest_files(closest_ids)
                except Exception as e:
                    print(f"Failed to update is_index for closest files in cluster {label}: {e}")
        
        # Identify large clusters
        large_clusters = {label: points for label, points in clusters.items() if label != -1 and cluster_sizes[label] > self.threshold}

        # Handle large clusters
        for label, points in large_clusters.items():
            points = np.array(points)
            files = np.array(cluster_files[label])
            ids = np.array(cluster_ids[label])

            # Apply KMeans to the points in the large cluster
            kmeans = KMeansClustering(n_clusters=1)
            kmeans.fit_predict(points)
            centroids, kmeans_centroid_files = kmeans.get_centroids(points, files)
            centroid = centroids[0]


            cluster_centroids[label] = centroid
            centroid_files[label] = kmeans_centroid_files[0]

            # Select closest `files_number` points to the centroid
            files_number = int(maximum_number * 2.5)
            closest_indices = np.argsort(distances)[:files_number]
            closest_files = files[closest_indices]
            closest_ids = ids[closest_indices]

            # Set `is_index = True` for the closest `maximum_number` files
            closest_maximum_indices = np.argsort(distances)[:maximum_number]
            closest_maximum_ids = ids[closest_maximum_indices]
            try:
                self.update_is_index_for_closest_files(closest_maximum_ids)
            except Exception as e:
                print(f"Failed to update is_index for closest files in cluster {label}: {e}")


            # Delete remaining points
            to_delete_ids = set(ids) - set(closest_ids)
            to_delete_files = list(set(files) - set(closest_files))
            try:
                self.delete_files(to_delete_ids, to_delete_files)
                print(label)
            except Exception as e:
                print(f"Failed to delete records with label {label} from the database: {e}")
        self.centroid_files = centroid_files
        self.cluster_centroids = cluster_centroids

    def query_audio_file(self, file_path, isSimilarity):
        
        if file_path.lower().endswith('.wav'):
            try:
                afeatures = self.extract_voiceprint(file_path)
                dd, ii = self.search_vector(afeatures, isSimilarity)
                self.result = np.column_stack((ii.T, dd.T))
                file_ids = self.get_file_ids(ii)
                file_names = self.get_file_names(file_ids)
                
                return self.result, file_ids, file_names
            except Exception as ex:
                self.logger.error('error in features for searching- from audio: %s', repr(ex))
    
    def get_file_ids(self, indices):
        if self.IDs is not None:
            return [self.IDs[idx] for idx in indices[0]]
        else:
            return None
    
    def get_file_names(self, file_ids):
        try:
            records = self.db.query(models.Record).filter(models.Record.id.in_(file_ids)).all()
            file_names = {record.id: record.file_name for record in records}
            return [file_names[file_id] for file_id in file_ids]
        except Exception as ex:
            self.logger.error('Error getting file names from database: %s', repr(ex))
            return None
    
    def load_or_build_index(self, isSimilarity):
        if not isSimilarity:
            if os.path.exists(self.voice_index_path):
                self.index = faiss.read_index(self.voice_index_path)
                with open(self.ids_path, 'rb') as f:
                    self.IDs = pickle.load(f)
            else:
                self.index_data_with_faiss()
        else:
            if os.path.exists(self.voice_index_cosine_path):
                self.cosine_index = faiss.read_index(self.voice_index_cosine_path)
                with open(self.ids_path, 'rb') as f:
                    self.IDs = pickle.load(f)
            else:
                if os.path.exists(self.voice_index_path):
                    self.build_cosine_index_from_l2()
                else:
                    self.index_data_with_faiss()
                    self.build_cosine_index_from_l2()


    def index_data_with_faiss(self):
        condition = models.Record.is_indexed == True
        ids, file_names, sound_vectors = self.read_vectors_from_table(condition)
        if sound_vectors is not None:
            sound_vectors = np.array(sound_vectors, dtype=np.float32)
            # Build index with L2 distance
            self.index = faiss.IndexFlatL2(len(sound_vectors[0]))
            # Add sound vectors to the index
            self.index.add(sound_vectors)
            faiss.write_index(self.index, self.voice_index_path)
            # Save the IDs
            with open(self.ids_path, 'wb') as f:
                pickle.dump(self.IDs, f)
    
    def build_cosine_index_from_l2(self):
        # Load the existing L2 index
        self.index = faiss.read_index(self.voice_index_path)
        
        # Retrieve all the vectors from the L2 index
        n_total = self.index.ntotal
        all_vectors = np.zeros((n_total, self.index.d), dtype=np.float32)
        
        for i in range(n_total):
            all_vectors[i] = self.index.reconstruct(i)

        # Normalize the vectors
        faiss.normalize_L2(all_vectors)
        
        # Create a new index with Inner Product (IP) distance
        self.cosine_index = faiss.IndexFlatIP(all_vectors.shape[1])
        
        # Add normalized vectors to the new cosine similarity index
        self.cosine_index.add(all_vectors)
        
        # Save the new cosine similarity index
        faiss.write_index(self.cosine_index, self.voice_index_cosine_path)
        
        # Save the IDs (IDs remain the same)
        with open(self.ids_path, 'wb') as f:
            pickle.dump(self.IDs, f)
        



    def normalize_distance(self, x):
        return 2 * np.exp(-x)/(1+np.exp(-x))

    def search_vector(self, query_vector, isSimilarity):
        if not isSimilarity:
            if self.index is not None:
                distances, indices = self.index.search(query_vector.reshape(1, 256), self.top_k)
                distances = self.normalize_distance(np.array(distances))
                return 100 * distances, indices 
        else:
            if self.cosine_index is not None:
                
                # Normalize the query vector
                faiss.normalize_L2(query_vector.reshape(1, -1))
                
                # Perform the search
                similarities, indices = self.cosine_index.search(query_vector.reshape(1, -1), self.top_k)
                # Convert similarities to distances (optional)
                distances = 1 - similarities  
                return 100* similarities, indices
        return [0], [0]   
        

    def add_record_to_database(self, file_path, features, text):
        try:
            new_record = models.Record(
                file_name=file_path,
                text=text,
                voiceprint=features,
                is_indexed=False
            )
            self.db.add(new_record)
            self.db.commit()
            self.db.refresh(new_record)
        except Exception as error:
            self.logger.error('Error inserting vector into the database: %s', error)

    def read_vectors_from_table(self, condition = None):
        try:
            if condition:
                print("with condition ", condition)
                records = self.db.query(models.Record).filter(condition).all()
            else:
                records = self.db.query(models.Record).all()

            self.IDs = [record.id for record in records]
            file_names = [record.file_name for record in records]
           
            # Ensure all vectors have the same shape
            sound_vectors = []
            for record in records:
                if record.voiceprint:
                    vector = np.array(record.voiceprint, dtype=np.float32)
                    sound_vectors.append(vector)
            return self.IDs, file_names, sound_vectors
        except Exception as ex:
            self.logger.error('error reading vectors from database: %s', repr(ex))
            return None
    
    def delete_files(self, ids_of_files, names_of_files):
        try:
            # Convert IDs to native int
            ids_of_files = self.convert_to_native_int(ids_of_files)

            # Fetch records that match the provided IDs
            records = self.db.query(models.Record).filter(models.Record.id.in_(ids_of_files)).all()
            
            # Delete records from the database
            self.db.query(models.Record).filter(models.Record.id.in_(ids_of_files)).delete(synchronize_session=False)
            self.db.commit()
            
            # Log which records were deleted
            logging.info(f"Deleted records with ids: {ids_of_files}")

        except SQLAlchemyError as e:
            logging.error(f"Failed to delete records with ids {ids_of_files} from the database: {e}")
            self.db.rollback()
            return
        
        # Delete files from the filesystem
        for file_name in names_of_files:
            try:
                os.remove(file_name)
                logging.info(f"Deleted file '{file_name}' from device.")
            except OSError as e:
                logging.error(f"Error deleting file '{file_name}': {e}")

    
    def update_is_index_for_closest_files(self, ids_of_files):
        try:
            # Convert IDs to native int
            ids_of_files = self.convert_to_native_int(ids_of_files)

            # Fetch records that match the provided IDs
            records = self.db.query(models.Record).filter(models.Record.id.in_(ids_of_files)).all()

            # Update the `is_index` feature to `True`
            for record in records:
                record.is_indexed = True

            # Commit the changes to the database
            self.db.commit()
            

        except Exception as e:
            self.db.rollback() 
            self.logger.error('Error updating records in the database: %s', repr(e))

    def make_records_non_active(self):
        try:
            # Fetch all records
            records = self.db.query(models.Record).all()

            # Update the `is_index` feature to `False` to all records
            for record in records:
                record.is_indexed = False

            # Commit the changes to the database
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            self.logger.error('Error updating records in the database: %s', repr(e))

    
    def convert_to_native_int(self, ids):
        return [int(id) for id in ids]