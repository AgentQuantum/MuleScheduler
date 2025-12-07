import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../services/api';
import { User } from '../types/scheduler';
import { useToast } from './Toast';

interface ProfileEditModalProps {
  show: boolean;
  onHide: () => void;
  user: User | null;
  onUpdate: (updatedUser: User) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ show, onHide, user, onUpdate }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bio: '',
    class_year: '',
  });
  const [removePicture, setRemovePicture] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        class_year: user.class_year?.toString() || '',
      });
      setRemovePicture(false);
      // Set preview to existing profile picture if available
      if (user.profile_picture_url) {
        const fullUrl = user.profile_picture_url.startsWith('http')
          ? user.profile_picture_url
          : `http://localhost:5000${user.profile_picture_url}`;
        setPreviewUrl(fullUrl);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('danger', 'Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast('danger', 'Image size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setRemovePicture(false); // Cancel removal if new file is selected
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemovePicture(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Add file if selected
      if (selectedFile) {
        formDataToSend.append('profile_picture', selectedFile);
      } else if (previewUrl === null && user.profile_picture_url) {
        // If preview was removed, we need to handle deletion
        // For now, we'll just not send the file field
      }

      // Add other fields
      formDataToSend.append('bio', formData.bio || '');
      if (user.role === 'user') {
        formDataToSend.append('class_year', formData.class_year || '');
      }
      // Handle picture removal
      if (removePicture && !selectedFile) {
        formDataToSend.append('remove_picture', 'true');
      }

      const response = await api.put('/users/me', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onUpdate(response.data);
      showToast('success', 'Profile updated successfully!');
      setSelectedFile(null);
      onHide();
    } catch (error: any) {
      showToast('danger', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Profile Picture</Form.Label>
            {previewUrl && (
              <div className="mb-3 text-center">
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '2px solid #E5E7EB',
                  }}
                />
                <div className="mt-2">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleRemovePicture}
                    disabled={loading}
                  >
                    Remove Picture
                  </Button>
                </div>
              </div>
            )}
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Upload an image from your computer (max 5MB, PNG, JPG, GIF, or WebP)
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Bio / Details</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Tell us a bit about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              maxLength={500}
            />
            <Form.Text className="text-muted">{formData.bio.length}/500 characters</Form.Text>
          </Form.Group>

          {user.role === 'user' && (
            <Form.Group className="mb-3">
              <Form.Label>Class Year</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g., 2025"
                min="2020"
                max="2030"
                value={formData.class_year}
                onChange={(e) => setFormData({ ...formData, class_year: e.target.value })}
              />
              <Form.Text className="text-muted">Your expected graduation year</Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProfileEditModal;
