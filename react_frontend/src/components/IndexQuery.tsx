import React from 'react';
import { useState } from 'react';
import { CircleLoader } from 'react-spinners';
import classNames from 'classnames';
import queryIndex, { ResponseSources } from '../apis/queryIndex';
import styled from 'styled-components';

const IndexQueryDiv = styled.div`
display: flex;
flex-direction: column;
width: 50%;
gap: 15px;

`
const IndexQueryInputDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  background-color: ${props => props.theme.primary};
  border-radius: 5px;
  padding: 10px;
`
const Loader = styled.div`
  align-self: center;
  opacity: 0;
  transition: opacity 300ms linear;

  &--loading {
    opacity: 1;
  }
`

const ResultsDiv = styled.div`
  opacity: 1;
  transition: opacity 300ms linear;
  background-color: ${props => props.theme.primary};
  border-radius: 5px;
  font-size: 12px;
  padding: 5px;
  height: 20vh;
  overflow-x: scroll;

  &--loading {
    opacity: 0;
  }
`
const SourcesDiv = styled.div`
  opacity: 1;
  transition: opacity 300ms linear;
  background-color: ${props => props.theme.primary};
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  height: calc(26.3vh - 22px);
  padding: 5px;
  text-align: left;
  overflow-x: scroll;

  &--loading {
    opacity: 0;
  }
`
const SourcesItem = styled.div`
height: 100px;
border-bottom: 1px solid ${props => props.theme.text_main};
margin: 0px;
width: 100%;

&:first-child {
  height: 40px;
  border-bottom: 1px solid ${props => props.theme.text_main} !important;
  text-align: center;
  margin-bottom: 5px;
}

&:last-child {
  border-bottom: none;
}

&__id {
  font-size: 25px;
  margin-bottom: 3px;
  margin-top: 0;
}

&__text {
  font-size: 12px;
  margin-bottom: 3px;
  margin-top: 0;
}

&__footer {
  font-size: 10px;
  margin: 0;
}

`



const IndexQuery = () => {
  const [isLoading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseSources, setResponseSources] = useState<ResponseSources[]>([]);

  const handleQuery = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == 'Enter') {
      setLoading(true);
      queryIndex(e.currentTarget.value, "texts").then((response) => {
        setLoading(false);
        setResponseText(response.text);
        setResponseSources(response.sources);
      });
    }
  };

  const sourceElems = responseSources.map((source) => {
    const nodeTitle =
      source.doc_id.length > 28
        ? source.doc_id.substring(0, 28) + '...'
        : source.doc_id;
    const nodeText =
      source.text.length > 150 ? source.text.substring(0, 130) + '...' : source.text;

    return (
      <SourcesItem key={source.doc_id}>
        <p className='id'>{nodeTitle}</p>
        <p className='text'>{nodeText}</p>
        <p className='footer'>
          Similarity={source.similarity}, start={source.start}, end=
          {source.end}
        </p>
      </SourcesItem>
    );
  });

  return (
    <IndexQueryDiv>
      <IndexQueryInputDiv>
        <label htmlFor='query-text'>Ask a question!</label>
        <input
          type='text'
          name='query-text'
          placeholder='Enter a question here'
          onKeyDown={handleQuery}
        ></input>
      </IndexQueryInputDiv>
      <Loader>
        <CircleLoader
          className={classNames({
            '--loading': isLoading,
          })}
          color='#00f596'
        />
      </Loader>

      <ResultsDiv
        className={classNames({
          '--loading': isLoading,
        })}
      >
        <SourcesItem>
          <p className='id'>Query Response</p>
        </SourcesItem>
        {responseText}
      </ResultsDiv>
      <SourcesDiv
        className={classNames({
          '--loading': isLoading,
        })}
      >
        <SourcesItem>
          <p className='id'>Response Sources</p>
        </SourcesItem>
        {sourceElems}
      </SourcesDiv>
    </IndexQueryDiv>
  );
};

export default IndexQuery;
