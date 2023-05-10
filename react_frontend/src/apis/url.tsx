
var url = '';
if (process.env.NODE_ENV === 'production') {
    url = 'http://https://chat-real-estate-backend.onrender.com/5601';
}
else if (process.env.NODE_ENV === 'development') {
    url = 'http://localhost:5601';
}

export default url;