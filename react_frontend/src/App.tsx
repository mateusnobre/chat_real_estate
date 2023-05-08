import Header from './components/Header';
import DocumentTools from './components/DocumentTools';
import IndexQuery from './components/IndexQuery';
import React from 'react';
import './style.css';
import { ThemeProvider } from 'styled-components';


export const theme = {
  primary: '#edfbf1',
  secondary: '#bee08b',
  secondary_hover: '#83aa49',
  text_main: '#000000',
  text_contrast: '#ffffff',
  header_big_block: '#f35f2b',
  header_narrow_block: '#00f596',
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className='app'>
        <Header />
        <div className='content'>
          <DocumentTools />
          <IndexQuery />
        </div>
      </div>
    </ThemeProvider>

  );
}

export default App;
