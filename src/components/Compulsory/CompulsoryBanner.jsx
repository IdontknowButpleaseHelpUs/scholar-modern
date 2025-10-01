import styles from "../../styles/maincompo.module.css";

const CompulsoryBanner = () => {
    return (
        <div className={styles.compulsory}>
            <img src="../assets/se_kmitl_logo.png" alt="logo" className={styles.logo} />
            <p className={styles.compulsoryText}>
                <span>S</span>oftware{" "}
                <span style={{ color: "rgb(255,111,0)", textShadow: "2px 2px px black" }}>
                    E
                </span>
                ngineering
            </p>
        </div>
    );
};

export default CompulsoryBanner;