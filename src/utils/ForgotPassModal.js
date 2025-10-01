function setupForgotPasswordModal(triggerId) {
   const passModal = document.getElementById('password-modal');
   const requestBtn = document.getElementById(triggerId); // dynamic trigger (settings OR login)
   const cancelBtn = document.getElementById('cancel-request');
   const confirmBtn = document.getElementById('confirm-request');
   const passwordEmail = document.getElementById('password-email');

   if (!requestBtn || !passModal) {
      console.warn("Forgot Password Modal elements not found.");
      return;
   }

   // Open modal
   requestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      passModal.style.display = 'flex';
   });

   // Close modal
   cancelBtn.addEventListener('click', () => {
      passModal.style.display = 'none';
      passwordEmail.value = '';
   });

   // Close when clicking outside
   window.addEventListener('click', (e) => {
      if (e.target === passModal) {
         passModal.style.display = 'none';
         passwordEmail.value = '';
      }
   });

   // Confirm request
   confirmBtn.addEventListener('click', async () => {
      const email = passwordEmail.value.trim();
      if (!email) {
         alert("Please enter your email!");
         return;
      }

      const message = "I would like to reset my password.";
      const confirmReset = window.confirm(
         "Are you sure you want to request a password reset? If yes, please wait, admin will contact you soon."
      );
      if (!confirmReset) return;

      try {
         const formData = new FormData();
         formData.append('email', email);
         formData.append('message', message);

         const res = await fetch('https://formspree.io/f/myzdwdvq', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
         });

         if (res.ok) {
            alert("Password reset request sent! Admin will contact you with password reset request soon.");
            passModal.style.display = 'none';
            passwordEmail.value = '';
         } else {
            alert("Failed to send request. Try again later.");
         }
      } catch (err) {
         console.error(err);
         alert("Error sending request.");
      }
   });
}

window.setupForgotPasswordModal = setupForgotPasswordModal;


