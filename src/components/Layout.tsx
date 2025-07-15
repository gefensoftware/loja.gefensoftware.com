import { Outlet, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import { api } from "../api";
import { useEffect, useState } from "react";
import { enterprisesAtom } from "../store/atoms/enterprises";
import { useAtom } from "jotai";
import LoadingScreen from "./LoadingScreen";

const Layout = () => {
  const { name_store } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [enterprise, setEnterprise] = useAtom(enterprisesAtom);
  const getEnterprise = async () => {
    try {
      const { data } = await api.get(`/enterprise/${name_store}`);
      setEnterprise(data);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    getEnterprise();
  }, [name_store]);

  
  useEffect(() => {
    document.title = `${enterprise?.name} | Cardápio Digital`;
  }, [enterprise]);


  useEffect(() => {
    if (enterprise?.theme) {
      const root = document.documentElement;
      root.style.setProperty('--light-primary-color', enterprise.theme.light_primary_color);
      root.style.setProperty('--light-secondary-color', enterprise.theme.light_secondary_color);
      root.style.setProperty('--light-background-color', enterprise.theme.light_background_color);
      root.style.setProperty('--light-text-color', enterprise.theme.light_text_color);
    }
  }, [enterprise?.theme]);

  return (
    <>
      {isLoading ? (
        <LoadingScreen enterpriseName={enterprise?.name} />
      ) : (
        <>
          <Outlet />
          <Navbar />
        </>
      )}
    </>


  );
};

export default Layout;