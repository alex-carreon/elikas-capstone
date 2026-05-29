import api from "@/api";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { useUserContext } from "@/context/AuthContext";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { toast } from "sonner";
import AlertDialogue from "@/components/AlertDialogue";

function UserDetails() {
  const { id } = useParams();
  const { token } = useUserContext();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [willDeac, setWillDeac] = useState(false);

  //   Get Details
  useEffect(() => {
    if (id) {
      const getIndivDetails = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/admin/users/${id}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("response", response);

          if (!response) {
            return new Error("Failed to retrieve data");
          }

          const userDetails = response.data;
          setUsername(userDetails.username);
          setFirstname(userDetails.first_name);
          setLastname(userDetails.last_name);
          setEmail(userDetails.email);
          setLocation(userDetails.indiv_location);
          setPhone(userDetails.phone);
          setCreatedAt(userDetails.created_at);
        } catch (err: string | any) {
          Error(err.message || "An error occurred");
        } finally {
          setLoading(false);
        }
      };

      getIndivDetails();
    }
  }, []);

  const deacIndiv = async () => {
    try {
      const deacPromise = new Promise(async (resolve, reject) => {
        const response = await api.patch(`/admin/users/${id}/deactivate`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(response);

        const userDataDelete = await response.data;

        if (!response) {
          reject(new Error(userDataDelete.error || "Deactivation failed"));
        } else resolve(userDataDelete);
      });

      toast.promise(deacPromise, {
        loading: "Deactivating this account...",
        success: "Account Deactivated!",
        position: "top-center",
      });

      deacPromise.then(() => {
        navigate("/admin-indiv");
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <>
      {willDeac && (
        <AlertDialogue
          contentId="Admin_IndivDeacContent"
          closeId="Admin_IndivDeacClose"
          actionId="Admin_IndivDeacBtn"
          open={willDeac}
          title="You are about to delete this pin"
          description="Deleting this pin will remove it from the map and your history permanently."
          buttonText="Delete"
          onClose={() => {
            setWillDeac(false);
          }}
          onClick={deacIndiv}
        />
      )}
      <FormLayout
        isAvatar
        updateId="Admin_IndivUpdateBtn"
        deleteId="Admin_IndivDeleteBtn"
        deleteClick={() => setWillDeac(true)}
      >
        {loading && (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        )}
        <TextField
          label="User ID"
          inputType="text"
          id="Admin_IndivIdField"
          value={id}
          readonly
        />
        <TextField
          label="Username"
          inputType="text"
          id="Admin_IndivUsernameField"
          value={username}
          readonly
        />
        <TextField
          label="First Name"
          inputType="text"
          id="Admin_IndivFirstnameField"
          value={firstname}
          readonly
        />
        <TextField
          label="Last Name"
          inputType="text"
          id="Admin_IndivLastnameField"
          value={lastname}
          readonly
        />
        <TextField
          label="Email"
          inputType="text"
          id="Admin_IndivEmailField"
          value={email}
          readonly
        />
        <TextField
          label="Address"
          inputType="text"
          id="Admin_IndivAddressField"
          value={location}
          readonly
        />
        <TextField
          label="Contact Number"
          inputType="text"
          id="Admin_IndivContactNoField"
          value={phone}
          readonly
        />
        <TextField
          label="Created At"
          inputType="text"
          id="Admin_IndivCreatedField"
          value={createdAt}
          readonly
        />
      </FormLayout>
    </>
  );
}

export default UserDetails;
