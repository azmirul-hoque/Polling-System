const loginSuccess = `
 <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #000;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
      }
      .success-container {
        background: rgba(0, 0, 0, 0.4);
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        width: 350px;
        text-align: center;
      }
      .success-container h1 {
        color:  #bbf63c;
        margin-bottom: 15px;
      }
      .success-container p {
        color:  #bbf63c;
        margin-bottom: 20px;
      }
      .success-container button {
        padding: 10px 20px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      .success-container button:hover {
        background-color: #218838;
      }
    </style>
    <div class="success-container">
      <h1>Login Successful!</h1>
      <p>Welcome back! You have successfully logged in.</p>
      <button onclick="window.location.href='/'">Go to Home</button>
    </div>
    
`;
export default loginSuccess;
