import React from 'react';
import styled from 'styled-components';

const DocumentViewerDiv = styled.div`
background-color:  ${props => props.theme.primary};
  height: calc(50vh - 10px);
  overflow-x: scroll;
  border-radius: 5px;
`
const DocumentViewerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px 5px;
`

const DocumentViewerListItem = styled.div`

border-bottom: 1px solid ${props => props.theme.text_main};
height: 75px;
overflow: hidden;

&:last-child {
  border-bottom: none;
}

&:first-child {
  height: 40px;
  border-bottom: 1px solid ${props => props.theme.text_main} !important;
}
`
const DocumentViewerListHeader = styled.p`

margin: 0;
font-size: 25px;
`


const DocumentViewerListTitle = styled.p`

text-align: left;
margin: 0;
font-size: 25px;
`

const DocumentViewerListText = styled.p`

text-align: left;
font-size: 12px;
margin: 0;
padding: 3px 0px;

`

type Document = {
  id: string;
  text: string;
};

const MAX_TITLE_LENGTH = 32;
const MAX_DOC_LENGTH = 150;

type DocumentViewerProps = {
  documentList: Document[];
};

const DocumentViewer = ({ documentList }: DocumentViewerProps) => {
  const prepend = (array: JSX.Element[], value: JSX.Element): JSX.Element[] => {
    const newArray = array.slice();
    newArray.unshift(value);
    return newArray;
  };

  let documentListElems = documentList.map((document) => {
    // TODO - redo trimming using CSS and text-overflow: ellipsis
    const id =
      document.id.length < MAX_TITLE_LENGTH
        ? document.id
        : document.id.substring(0, MAX_TITLE_LENGTH) + '...';
    const text =
      document.text.length < MAX_DOC_LENGTH
        ? document.text
        : document.text.substring(0, MAX_DOC_LENGTH) + '...';
    return (
      <DocumentViewerListItem key={document.id}>
        <DocumentViewerListTitle>{id}</DocumentViewerListTitle>
        <DocumentViewerListText>{text}</DocumentViewerListText>
      </DocumentViewerListItem>
    );
  });

  // prepend header
  documentListElems = prepend(
    documentListElems,
    <DocumentViewerListItem key='viewer_title'>
      <DocumentViewerListHeader>My Documents</DocumentViewerListHeader>
    </DocumentViewerListItem>,
  );

  console.log(documentListElems);

  return (
    <DocumentViewerDiv>
      <DocumentViewerList>
        {documentListElems.length > 0 ? (
          documentListElems
        ) : (
          <div>
            <DocumentViewerListTitle>Upload your first document!</DocumentViewerListTitle>
            <DocumentViewerListText>
              You will see the title and content here
            </DocumentViewerListText>
          </div>
        )}
      </DocumentViewerList>
    </DocumentViewerDiv>
  );
};

export default DocumentViewer;
