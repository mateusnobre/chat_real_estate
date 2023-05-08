import React from 'react';
import { useEffect, useState } from 'react';
import DocumentUploader from './DocumentUploader';
import DocumentViewer from './DocumentViewer';
import fetchDocuments, { Document } from '../apis/fetchDocuments';
import styled from 'styled-components';

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

const DocumentTools = () => {
  const [refreshViewer, setRefreshViewer] = useState(false);
  const [documentList, setDocumentList] = useState<Document[]>([]);

  // Get the list on first load
  useEffect(() => {
    fetchDocuments().then((documents) => {
      setDocumentList(documents);
    });
  }, []);

  useEffect(() => {
    if (refreshViewer) {
      setRefreshViewer(false);
      fetchDocuments().then((documents) => {
        setDocumentList(documents);
      });
    }
  }, [refreshViewer]);

  return (
    <DocumentToolsDiv>
      <DocumentUploader setRefreshViewer={setRefreshViewer} />
      <DocumentViewer documentList={documentList} />
    </DocumentToolsDiv>
  );
};

export default DocumentTools;
