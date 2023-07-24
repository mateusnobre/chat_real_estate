import React from 'react';
import { ChangeEvent, useState } from 'react';
import styled from 'styled-components';
import useApiClient from '../helpers/api';

import { Button, Loading } from '@nextui-org/react';
const Uploader = styled.div`

width: 400px;
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
  justify-content: space-around;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.text_main};
  font-size: 14px;
  background-color: ${props => props.theme.secondary};
  width: 100%;
  height: 40px;
  border: 1px solid ${props => props.theme.secondary};
  svg {
    height: 20px;
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
width: 100%;

text-align: left;
overflow: hidden;
border-radius: 5px;

p {
  background-color:  ${props => props.theme.primary};
  text-align: center;
  font-size: 15px;

}
`

interface HTMLInputEvent extends ChangeEvent {
  target: HTMLInputElement & EventTarget;
}

type DocumentUploaderProps = {
  setRefreshViewer: (refresh: boolean) => void;
  indexName: string;

};

const DocumentUploader = ({ setRefreshViewer, indexName }: DocumentUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File>();
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const apiClient = useApiClient();
  const changeHandler = (event: HTMLInputEvent) => {
    if (event.target && event.target.files) {
      setSelectedFile(event.target.files[0]);
      setIsFilePicked(true);
    }
  };

  const handleSubmission = async () => {
    if (selectedFile) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename_as_doc_id', 'true');
      const response = await apiClient.makeRequest('POST',
        `/llm_integration/upload-file/?index_name=${indexName}`,
        formData);
      if (response && response.status == 200) {
        setRefreshViewer(true);
        setSelectedFile(undefined);
        setIsFilePicked(false);
        setIsLoading(false);
      }
    }
  };

  return (
    <Uploader>
      <input
        type='file'
        name='file-input'
        id='file-input'
        accept='.pdf,.txt,.json,.md,.xlsx,.xls,.csv,.html,.docx,.doc'
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
        <span>(.pdf,.txt,.json,.md,.xlsx,.xls,.csv,.html, .docx., doc)</span>
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
        <Button onClick={handleSubmission}>
          Submit
        </Button>
      )}
      {
        isLoading &&
        <Button disabled type="submit">
          <Loading type="points" color="currentColor" size="sm" />
        </Button>
      }
    </Uploader>
  );
};

export default DocumentUploader;
