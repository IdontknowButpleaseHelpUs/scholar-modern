import React from "react";
import styles from "../styles/settingpage.module.css";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MainCompo from "./MainCompo";
import Footer from "./Footer";

const SettingPage = () => {
   return (
      <div className={styles.settingPage}>
         <Header />
         {/* <Sidebar /> */}
         
         {/* <MainCompo /> */}
         <Footer />
      </div>
   );
};

export default SettingPage;