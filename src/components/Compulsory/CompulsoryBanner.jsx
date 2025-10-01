import styles from "../../styles/maincompo.module.css";
import { useNavigate } from "react-router-dom";

const CompulsoryBanner = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/');
    };

    return (
        <div 
            className={styles.compulsory} 
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
        >
            <img src="../assets/se_kmitl_logo.png" alt="logo" className={styles.logo} />
            <p className={styles.compulsoryText}>
                <span>S</span>oftware{" "}
                <span style={{ color: "rgb(255,111,0)", textShadow: "2px 2px 5px black" }}>
                    E
                </span>
                ngineering
            </p>
        </div>
    );
};

export default CompulsoryBanner;