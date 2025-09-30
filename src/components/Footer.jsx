import React from "react";
import styles from "../styles/footer.module.css";

const Footer = () => {
   return (
      <div className={styles.footer}>
         <div className={styles.footerContent}>
            <div className={styles.contactUs}>
               <h4 className={styles.contactUsH4}>Contact Us</h4>
               <ul className={styles.contactUsUl}>
                  <li className={styles.contactUsLi}>
                     Line: <a className={styles.contactUsA} href="https://line.me/ti/p/your-line-id" target="_blank" rel="noopener">your-line-id</a>
                  </li>
                  <li className={styles.contactUsLi}>
                     Phone: <a className={styles.contactUsA} href="tel:+66000000000">+66 0000 0000</a>
                  </li>
                  <li className={styles.contactUsLi}>
                     Email: <a className={styles.contactUsA} href="mailto:example@gmail.com">example@gmail.com</a>
                  </li>
               </ul>
            </div>

            <div className={styles.location}>
               <h4 className={styles.locationH4}>Location</h4>
               <p className={styles.locationP}>
                  สำนักงานบริหารวิชาการและคุณภาพการศึกษา<br />
                  อาคาร 6 ชั้น 3 สจล.<br />
                  แขวงลาดกระบัง เขตลาดกระบัง<br />
                  กรุงเทพมหานคร 10520
               </p>
            </div>

            <div className={styles.getSocial}>
               <h4 className={styles.getSocialH4}>Get Social</h4>
               <div className={styles.socialIcons}>
                  <a className={styles.socialIconsA} href="https://www.facebook.com/kmitlofficial" target="_blank" rel="noopener">
                     <img className={styles.socialIconsImg} src="/assets/facebook.png" alt="Facebook" />
                     <span>KMITL</span>
                  </a>
                  <a className={styles.socialIconsA} href="https://x.com/Kmitlofficial" target="_blank" rel="noopener">
                     <img className={styles.socialIconsImg} src="/assets/twitter.png" alt="Twitter" />
                     <span>KMITL</span>
                  </a>
                  <a className={styles.socialIconsA} href="https://www.instagram.com/kmitlofficial" target="_blank" rel="noopener">
                     <img className={styles.socialIconsImg} src="/assets/instagram.png" alt="Instagram" />
                     <span>kmitlofficial</span>
                  </a>
               </div>
            </div>
         </div>

         <hr className={styles.hr} />

         <p className={styles.footerBottomText}>
            Copyright © 2020 - Developed by สำนักงานบริหารวิชาการและคุณภาพการศึกษา. Powered by Moodle
         </p>
      </div>
   );
};

export default Footer;