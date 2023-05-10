
var url = '';
if (process.env.NODE_ENV === 'production') {
    url = 'https://chat-real-estate-backend.onrender.com/';
}
else if (process.env.NODE_ENV === 'development') {
    url = 'http://localhost:8000';
}

export default url;