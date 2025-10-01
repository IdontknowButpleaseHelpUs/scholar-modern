import React, { useState, useRef } from 'react';
import styles from '../styles/settingsform.module.css';

const SettingsForm = ({ loggedUser, profileData, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    email: profileData.email || '',
    phone: profileData.phone || '',
    country: profileData.country || '',
    location: profileData.location || '',
    description: profileData.description || ''
  });
  
  const [profileImage, setProfileImage] = useState(
    profileData.profilePic 
      ? `http://127.0.0.1:5000${profileData.profilePic}`
      : '/assets/user.png'
  );
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        alert('Please select a valid PNG or JPG image.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }

      setSelectedFile(file);
      
      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Country validation
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fill out all required fields correctly.');
      return;
    }

    setIsSaving(true);

    try {
      // Update profile data
      const res = await fetch(
        `http://127.0.0.1:5000/api/${loggedUser.role}/${loggedUser.username}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loggedUser.token}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (!res.ok) throw new Error('Failed to update profile');
      
      // Upload profile picture if selected
      if (selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('profilePic', selectedFile);

        const uploadRes = await fetch(
          `http://127.0.0.1:5000/api/upload-profile-pic/${loggedUser.role}/${loggedUser.username}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${loggedUser.token}`
            },
            body: formDataUpload
          }
        );

        if (!uploadRes.ok) throw new Error('Failed to upload profile picture');
        
        const uploadJson = await uploadRes.json();
        if (uploadJson.data && uploadJson.data.profilePic) {
          setProfileImage(`http://127.0.0.1:5000${uploadJson.data.profilePic}`);
        }
      }

      alert('Profile updated successfully!');
      onProfileUpdate({ ...profileData, ...formData });
      setSelectedFile(null);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.profileSection}>
        {/* Profile Picture */}
        <div className={styles.profilePictureSection}>
          <div className={styles.profilePictureWrapper}>
            <img 
              src={profileImage} 
              alt="Profile" 
              className={styles.profileImage}
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".png,.jpg,.jpeg"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={styles.changePhotoBtn}
          >
            Change Picture
          </button>
          <p className={styles.imageHint}>PNG or JPG (max 5MB)</p>
        </div>

        {/* Account Details */}
        <div className={styles.accountDetails}>
          <div className={styles.detailRow}>
            <label className={styles.label}>First Name</label>
            <input
              type="text"
              value={profileData.firstName || ''}
              disabled
              className={styles.inputDisabled}
            />
          </div>

          <div className={styles.detailRow}>
            <label className={styles.label}>Last Name</label>
            <input
              type="text"
              value={profileData.lastName || ''}
              disabled
              className={styles.inputDisabled}
            />
          </div>

          <div className={styles.detailRow}>
            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@example.com"
              className={errors.email ? styles.inputError : styles.input}
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </div>

          <div className={styles.detailRow}>
            <label className={styles.label}>
              Phone <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+66 123 456 789"
              className={errors.phone ? styles.inputError : styles.input}
            />
            {errors.phone && (
              <span className={styles.errorText}>{errors.phone}</span>
            )}
          </div>

          <div className={styles.detailRow}>
            <label className={styles.label}>
              Location <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Bangkok"
              className={errors.location ? styles.inputError : styles.input}
            />
            {errors.location && (
              <span className={styles.errorText}>{errors.location}</span>
            )}
          </div>

          <div className={styles.detailRow}>
            <label className={styles.label}>
              Country <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Thailand"
              className={errors.country ? styles.inputError : styles.input}
            />
            {errors.country && (
              <span className={styles.errorText}>{errors.country}</span>
            )}
          </div>

          <div className={styles.detailRow}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows={4}
              className={styles.textarea}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className={styles.saveSection}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={styles.saveBtn}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default SettingsForm;