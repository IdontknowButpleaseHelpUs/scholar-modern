import CompulsoryBanner from "./CompulsoryBanner"
import styles from "../../styles/page.module.css"

const MainCompo = () => {
   return (
      <>
         {/* ====== Compulsory Banner ====== */}
         <CompulsoryBanner />

         {/* ====== Background Scroll ====== */}
         <div className={styles.backgroundScroll}>
            <img src="/assets/left-arrow.png" alt="left arrow" className={styles.leftArrow} />
            <img src="/assets/right-arrow.png" alt="right arrow" className={styles.rightArrow} />
            <img src="/assets/background2.jpg" alt="background" className={styles.background} />
         </div>

         {/* ====== About Us ====== */}
         <div className={styles.aboutUsContainer}>
            <span className={styles.aboutUsTitle}>KMITL Go Beyond the Limit</span>
            <p>
               <b>Go Education</b> ฉลองครบรอบ 60 ปี ...
            </p>
         </div>
      </>
   )
}

export default MainCompo