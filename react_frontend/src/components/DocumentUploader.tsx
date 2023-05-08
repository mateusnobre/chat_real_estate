import React from 'react';
import { ChangeEvent, useState } from 'react';
import { CircleLoader } from 'react-spinners';
import insertDocument from '../apis/insertDocument';
import styled from 'styled-components';

const Uploader = styled.div`

width: 100%;
display: flex;
flex-direction: column;
height: 150px;
gap: 5px;
input {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}
label {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.text_main};
  font-size: 14px;
  background-color: ${props => props.theme.secondary};
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.25);
  width: 100%;
  height: 40px;

  svg {
    height: 16px;
    margin-right: 4px;
  }

  &:hover {
    background-color: ${props => props.theme.secondary_hover};
  }
}

`

const UploaderDetails = styled.div`

display: flex;
flex-direction: row;
justify-content: flex-start;
align-items: center;
height: 40px;
text-align: left;
overflow: hidden;
border-radius: 5px;

p {
  background-color:  ${props => props.theme.primary};
  text-align: center;
  font-size: 15px;
  padding: 5px;
  width: 100%;
  width: 450px;
}
`

const UploaderButton = styled.button`
cursor: pointer;
display: inline-flex;
align-items: center;
justify-content: center;
border-radius: 4px;
font-size: 14px;
font-weight: 600;
color: ${props => props.theme.text_main};
font-size: 14px;
padding: 5px 8px;
box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.25);
width: 100px;
border: none;
align-self: center;
`

const UploaderLoader = styled.div`
align-self: center;

`

interface HTMLInputEvent extends ChangeEvent {
  target: HTMLInputElement & EventTarget;
}

type DocumentUploaderProps = {
  setRefreshViewer: (refresh: boolean) => void;
};

const DocumentUploader = ({ setRefreshViewer }: DocumentUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File>();
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const changeHandler = (event: HTMLInputEvent) => {
    if (event.target && event.target.files) {
      setSelectedFile(event.target.files[0]);
      setIsFilePicked(true);
    }
  };

  const handleSubmission = () => {
    if (selectedFile) {
      setIsLoading(true);
      insertDocument(selectedFile).then(() => {
        setRefreshViewer(true);
        setSelectedFile(undefined);
        setIsFilePicked(false);
        setIsLoading(false);
      });
    }
  };

  return (
    <Uploader>
      <input
        type='file'
        name='file-input'
        id='file-input'
        accept='.pdf,.txt,.json,.md,.xlsx,.xls,.csv,.html'
        onChange={changeHandler}
      />
      <label className='uploader__label' htmlFor='file-input'>
        <svg
          aria-hidden='true'
          focusable='false'
          data-prefix='fas'
          data-icon='upload'
          className='svg-inline--fa fa-upload fa-w-16'
          role='img'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 512 512'
        >
          <path
            fill='currentColor'
            d='M296 384h-80c-13.3 0-24-10.7-24-24V192h-87.7c-17.8 0-26.7-21.5-14.1-34.1L242.3 5.7c7.5-7.5 19.8-7.5 27.3 0l152.2 152.2c12.6 12.6 3.7 34.1-14.1 34.1H320v168c0 13.3-10.7 24-24 24zm216-8v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h136v8c0 30.9 25.1 56 56 56h80c30.9 0 56-25.1 56-56v-8h136c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z'
          ></path>
        </svg>
        <span>Upload file</span>
      </label>
      {isFilePicked && selectedFile ? (
        <UploaderDetails>
          <UploaderDetails>
            <p>{selectedFile.name}</p>
          </UploaderDetails>
        </UploaderDetails>
      ) : (
        <UploaderDetails>
          <p>Select a file to insert</p>
        </UploaderDetails>
      )}

      {isFilePicked && !isLoading && (
        <UploaderButton onClick={handleSubmission}>
          Submit
        </UploaderButton>
      )}
      {isLoading && <UploaderLoader><CircleLoader color='#00f596' /></UploaderLoader>}
    </Uploader>
  );
};

export default DocumentUploader;
