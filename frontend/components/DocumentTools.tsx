import React from 'react';
import { useEffect, useState } from 'react';
import DocumentUploader from './DocumentUploader.tsx';
import DocumentViewer from './DocumentViewer.tsx';

import styled from 'styled-components';
import useApiClient from '../helpers/api';

import Cookies from 'universal-cookie';

const cookies = new Cookies()

const DocumentToolsDiv = styled.div`

display: flex;
flex-direction: column;
width: 50%;
`


const URLUploader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #eee;
  color: #333;
  font-size: 1.2rem;
  `


type Document = {
  id: string;
  text: {
    text:
    string;
  }
};


const DocumentTools = (index: any) => {
  const [refreshViewer, setRefreshViewer] = useState(false);
  const [documentList, setDocumentList] = useState([]);
  const apiClient = useApiClient();
  const indexName = index.index;
  useEffect(() => {
    fetchDocuments();
  }
    , [indexName]);

  const fetchDocuments = async () => {
    const response = await apiClient.makeRequest('GET', `/llm_integration/get-documents?index_name=${indexName}`);

    if (!response || !response.data) {
      return;
    }
    console.log(response.data);
    const documentList = response.data.map(
      (element: Document) => (
        {
          id: element.id,
          text: element.text.text,
        }
      )
    )
    setDocumentList(documentList);
  }

  useEffect(() => {
    if (refreshViewer) {
      setRefreshViewer(false);
      fetchDocuments();
    }
  }, [refreshViewer]);

  return (
    <DocumentToolsDiv>
      <DocumentUploader setRefreshViewer={setRefreshViewer} indexName={indexName} />
      <DocumentViewer documentList={documentList} indexName={indexName} />
    </DocumentToolsDiv>
  );
};

export default DocumentTools;
