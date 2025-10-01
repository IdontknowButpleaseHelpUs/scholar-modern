import React, { useState } from 'react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
   const [email, setEmail] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const handleSubmit = async () => {
      if (!email.trim()) {
         alert("Please enter your email!");
         return;
      }

      const confirmReset = window.confirm(
         "Are you sure you want to request a password reset? If yes, please wait, admin will contact you soon."
      );

      if (!confirmReset) return;

      setIsSubmitting(true);

      try {
         const formData = new FormData();
         formData.append('email', email);
         formData.append('message', 'I would like to reset my password.');

         const res = await fetch('https://formspree.io/f/myzdwdvq', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
         });

         if (res.ok) {
            alert("Password reset request sent! Please wait, admin will contact you soon.");
            setEmail('');
            onClose();
         } else {
            alert("Failed to send request. Try again later.");
         }
      } catch (err) {
         console.error(err);
         alert("Error sending request.");
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleCancel = () => {
      setEmail('');
      onClose();
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
         handleCancel();
      }
   };

   if (!isOpen) return null;

   return (
      <div
         onClick={handleBackdropClick}
         style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
         }}
      >
         <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
         }}>
            <h2 style={{
               marginTop: 0,
               marginBottom: '10px',
               fontSize: '24px',
               color: '#1e3a8a',
               fontWeight: 'bold'
            }}>
               Forgot Password?
            </h2>

            <p style={{
               marginBottom: '20px',
               color: '#4a5568',
               fontSize: '14px',
               lineHeight: '1.5'
            }}>
               Enter your email address and we'll send you instructions to reset your password.
            </p>

            <div style={{ marginBottom: '20px' }}>
               <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#2d3748',
                  fontSize: '14px'
               }}>
                  Email Address
               </label>
               <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                  style={{
                     width: '100%',
                     padding: '12px',
                     border: '1px solid #cbd5e0',
                     borderRadius: '6px',
                     fontSize: '14px',
                     boxSizing: 'border-box',
                     outline: 'none',
                     transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e0'}
               />
            </div>

            <div style={{
               display: 'flex',
               gap: '12px',
               justifyContent: 'flex-end'
            }}>
               <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  style={{
                     padding: '10px 20px',
                     border: '1px solid #cbd5e0',
                     borderRadius: '6px',
                     backgroundColor: 'white',
                     color: '#4a5568',
                     cursor: isSubmitting ? 'not-allowed' : 'pointer',
                     fontSize: '14px',
                     fontWeight: '500',
                     transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                     if (!isSubmitting) e.target.style.backgroundColor = '#f7fafc';
                  }}
                  onMouseLeave={(e) => {
                     e.target.style.backgroundColor = 'white';
                  }}
               >
                  Cancel
               </button>

               <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                     padding: '10px 20px',
                     border: 'none',
                     borderRadius: '6px',
                     backgroundColor: isSubmitting ? '#a0aec0' : '#ff6f00',
                     color: 'white',
                     cursor: isSubmitting ? 'not-allowed' : 'pointer',
                     fontSize: '14px',
                     fontWeight: '500',
                     transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                     if (!isSubmitting) e.target.style.backgroundColor = '#e65c00';
                  }}
                  onMouseLeave={(e) => {
                     if (!isSubmitting) e.target.style.backgroundColor = '#ff6f00';
                  }}
               >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
               </button>
            </div>
         </div>
      </div>
   );
};

export default ForgotPasswordModal;