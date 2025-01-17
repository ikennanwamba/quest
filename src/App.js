import React, { useState } from 'react';

const App = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      console.log('Extracted data:', data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Parlay Tracker</h1>
      
      <div style={{ marginTop: '20px' }}>
        <input 
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ marginBottom: '10px' }}
        />
        
        {loading && <p>Processing image...</p>}
      </div>
    </div>
  );
};

export default App;
