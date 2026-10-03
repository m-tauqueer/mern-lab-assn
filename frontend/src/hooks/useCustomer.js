import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function useCustomer() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    let active = true;

    api
      .get("/customers/me")
      .then((response) => {
        if (active) {
          setCustomer(response.data);
        }
      })
      .catch(() => {
        if (active) {
          navigate("/login", { replace: true });
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  return customer;
}
