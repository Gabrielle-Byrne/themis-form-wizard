// api.js
import { getApiUrl } from './config';

export const submitFormWithFiles = async (formData, files) => {
    try {
      // Create FormData instance
      const submitData = new FormData();
      
      // Add form data as a string
      submitData.append('formData', JSON.stringify(formData));
      // Add files with unique names
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          submitData.append(`files`, file); // Keep the field name as 'files'
        });
      }
      const response = await fetch(`${getApiUrl()}/api/submit`, {
        method: 'POST',
        body: submitData,
        // Don't set Content-Type header - browser will set it with boundary
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Form submission failed');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  };

  // api.js
  export const submitFormWithOutFiles = async (formData) => {
    try {
      // Create FormData instance
      const submitData = new FormData();
      
      // Add form data as a string
      submitData.append('formData', JSON.stringify(formData));
      
      const response = await fetch(`${getApiUrl()}/api/submitintake`, {
        method: 'POST',
        body: submitData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Form submission failed');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  };