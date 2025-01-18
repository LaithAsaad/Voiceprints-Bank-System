from abc import ABC, abstractmethod
from sklearn.cluster import DBSCAN
from sklearn.cluster import KMeans
from scipy.spatial.distance import cdist
import numpy as np

# Define abstract class for clustering operation
class ClusteringStrategy(ABC):
    
    @abstractmethod
    def fit_predict(self, vectors):
        pass
    
    @abstractmethod
    def get_centroids(self, labels, vectors):
        pass

# Define child class (DBSCAN Algorithm)
class DBSCANClustering(ClusteringStrategy):
    
    def __init__(self, eps=0.08, min_samples=2, metric='cosine'):
        self.dbscan = DBSCAN(eps=eps, min_samples=min_samples, metric=metric)
        
    def fit_predict(self, vectors):
        return self.dbscan.fit_predict(vectors)
    
    def get_centroids(self, labels, vectors, file_names):
        labels = np.asarray(labels)
        centroids = []
        centroid_files = []
        unique_labels = set(labels)
        for label in unique_labels:
            if label == -1:
                continue
            
            cluster_vectors = vectors[labels == label]
            cluster_files = np.array(file_names)[labels == label]
            centroid = np.mean(cluster_vectors, axis=0)
            distances = cdist([centroid], cluster_vectors, metric='euclidean')
            closest_point_idx = np.argmin(distances)
            centroids.append(cluster_vectors[closest_point_idx])
            centroid_files.append(cluster_files[closest_point_idx])
        return centroids, centroid_files

# Define child class (Kmeans Algorithm)
class KMeansClustering(ClusteringStrategy):
    
    def __init__(self, n_clusters=8):
        self.kmeans = KMeans(n_clusters=n_clusters)
        
    def fit_predict(self, vectors):
        return self.kmeans.fit_predict(vectors)
    
    def get_centroids(self, vectors, file_names):
        centroids = self.kmeans.cluster_centers_
        centroid_files = []
        
        for centroid in centroids:
            # Calculate distances from the centroid to all points in the cluster
            distances = cdist([centroid], vectors, metric='euclidean')
            closest_point_idx = np.argmin(distances)
            closest_file = file_names[closest_point_idx]
            centroid_files.append(closest_file)
        
        return centroids, centroid_files
