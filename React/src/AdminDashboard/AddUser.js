import Form from "../Components/Forms";
export default function AddUser() {
    return (
        <Form
            title="Add New User"
            endPoint="create"
            button="Add User"
            navigate="/dashboard/users"
        />
    );
}
