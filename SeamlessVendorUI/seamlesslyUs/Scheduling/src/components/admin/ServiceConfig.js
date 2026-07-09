/**
 * Coffee & Conversations Collective - Service Configuration Component
 * Manage services, pricing, and availability
 */

import React, { useState, useEffect } from 'react';
import './ServiceConfig.css';

const ServiceConfig = () => {
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const serviceCategories = ['massage', 'cafe', 'events', 'podcast'];

  const defaultService = {
    name: '',
    category: 'massage',
    duration_options: [60],
    price: 0,
    price_by_duration: {},
    points_earned: 1,
    description: '',
    buffer_time: 15,
    active: true,
    requires_staff: true,
    max_advance_booking_days: 90,
    cancellation_hours: 24
  };

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/services');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = () => {
    setEditingService({ ...defaultService });
    setShowForm(true);
  };

  const handleEditService = (service) => {
    setEditingService({ ...service });
    setShowForm(true);
  };

  const handleSaveService = async () => {
    try {
      const method = editingService.id ? 'PUT' : 'POST';
      const url = editingService.id 
        ? `/api/services/${editingService.id}` 
        : '/api/services';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService)
      });

      const data = await response.json();

      if (data.success) {
        alert('Service saved successfully');
        setShowForm(false);
        setEditingService(null);
        loadServices();
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    const confirm = window.confirm('Are you sure you want to delete this service?');
    if (!confirm) return;

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Service deleted successfully');
        loadServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...service, active: !service.active })
      });

      const data = await response.json();

      if (data.success) {
        loadServices();
      }
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  const updateEditingService = (field, value) => {
    setEditingService(prev => ({ ...prev, [field]: value }));
  };

  const renderServiceForm = () => (
    <div className="service-form-modal">
      <div className="service-form">
        <h2>{editingService.id ? 'Edit Service' : 'Create New Service'}</h2>

        <div className="form-group">
          <label>Service Name *</label>
          <input
            type="text"
            value={editingService.name}
            onChange={(e) => updateEditingService('name', e.target.value)}
            placeholder="e.g., Swedish Massage"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={editingService.category}
              onChange={(e) => updateEditingService('category', e.target.value)}
            >
              {serviceCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Base Price ($) *</label>
            <input
              type="number"
              value={editingService.price}
              onChange={(e) => updateEditingService('price', parseFloat(e.target.value))}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={editingService.description}
            onChange={(e) => updateEditingService('description', e.target.value)}
            rows="3"
            placeholder="Describe the service..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Buffer Time (minutes)</label>
            <input
              type="number"
              value={editingService.buffer_time}
              onChange={(e) => updateEditingService('buffer_time', parseInt(e.target.value))}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Cancellation Hours</label>
            <input
              type="number"
              value={editingService.cancellation_hours}
              onChange={(e) => updateEditingService('cancellation_hours', parseInt(e.target.value))}
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={editingService.requires_staff}
                onChange={(e) => updateEditingService('requires_staff', e.target.checked)}
              />
              Requires Staff Assignment
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={editingService.active}
                onChange={(e) => updateEditingService('active', e.target.checked)}
              />
              Active (Available for Booking)
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button onClick={handleSaveService} className="save-btn">
            Save Service
          </button>
          <button onClick={() => { setShowForm(false); setEditingService(null); }} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="service-config">
      <div className="config-header">
        <h1>Service Configuration</h1>
        <button onClick={handleCreateService} className="create-btn">
          + Add New Service
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading services...</div>
      ) : (
        <div className="services-grid">
          {services.map(service => (
            <div key={service.id} className={`service-card ${!service.active ? 'inactive' : ''}`}>
              <div className="service-header">
                <h3>{service.name}</h3>
                <span className="category-badge">{service.category}</span>
              </div>
              
              <p className="service-description">{service.description}</p>
              
              <div className="service-details">
                <div className="detail-row">
                  <span>Price:</span>
                  <span className="price">${service.price}</span>
                </div>
                <div className="detail-row">
                  <span>Buffer Time:</span>
                  <span>{service.buffer_time} min</span>
                </div>
                <div className="detail-row">
                  <span>Cancellation:</span>
                  <span>{service.cancellation_hours}h before</span>
                </div>
                <div className="detail-row">
                  <span>Requires Staff:</span>
                  <span>{service.requires_staff ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="service-actions">
                <button onClick={() => handleEditService(service)} className="edit-btn">
                  Edit
                </button>
                <button 
                  onClick={() => handleToggleActive(service)} 
                  className={service.active ? 'deactivate-btn' : 'activate-btn'}
                >
                  {service.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDeleteService(service.id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && renderServiceForm()}
    </div>
  );
};

export default ServiceConfig;

