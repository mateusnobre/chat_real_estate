import React from 'react';
import { useEffect, useState } from 'react';
import DocumentUploader from './DocumentUploader';
import DocumentViewer from './DocumentViewer';
import Api from '../apis/api';
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


type Document = {
  id: string;
  text: string;
};


const DocumentTools = () => {
  const [refreshViewer, setRefreshViewer] = useState(false);
  const [documentList, setDocumentList] = useState<Document[]>([]);

  // Get the list on first load
  useEffect(() => {
    Api('GET', "getDocuments").then((documents) => {
      if (!documents) {
        return;
      }
      const documentList = documents.data.map(
        (element: Document) => (
          {
            id: element.id,
            text: element.text,
          }
        )
      )
      setDocumentList(documentList);
    });
  }, []);

  useEffect(() => {
    if (refreshViewer) {
      setRefreshViewer(false);
      Api('GET', "getDocuments").then((documents) => {
        if (!documents) {
          return;
        }
        const documentList = documents.data.map(
          (element: Document) => (
            {
              id: element.id,
              text: element.text,
            }
          )
        )
        setDocumentList(documentList);
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
