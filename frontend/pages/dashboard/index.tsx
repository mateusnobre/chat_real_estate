import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import { authCheck } from '../../utils/auth';
import useApiClient from '../../helpers/api';
import styled, { css } from 'styled-components';
import Cookies from 'universal-cookie';
import DocumentTools from '../../components/DocumentTools';
import { Button, Dropdown, Input, Loading, Spacer } from '@nextui-org/react';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 90vw;
  justify-content:space-around;
  align-items: flex-start;

`

const Loader = styled.div < { loading: boolean } > `
  align-self: center;
  opacity: 0;
  transition: opacity 300ms linear;

  ${({ loading }) =>
    loading &&
    css`
      opacity: 1;
    `}
`;

const ResultsDiv = styled.div < { loading: boolean } > `
  opacity: 1;
  transition: opacity 300ms linear;
  background-color: ${(props) => props.theme.primary};
  width: 100%;

  border: 1px solid ${(props) => props.theme.text_main};
  border-radius: 5px;
  font-size: 16px;
  height: 30vh;
  width: 50vw;
  margin-right: 30px;

  overflow-x: scroll;

  ${({ loading }) =>
    loading &&
    css`
      opacity: 0;
    `}
`;

const SourcesDiv = styled.div < { loading: boolean } > `
  opacity: 1;
  transition: opacity 300ms linear;
  background-color: ${(props) => props.theme.primary};
  border-radius: 5px;
  width: 50vw;
  margin-right: 30px;
  border: 1px solid ${(props) => props.theme.text_main};
  display: flex;
  flex-direction: column;
  height: calc(30vh - 22px);
  text-align: center;
  overflow-x: scroll;

  ${({ loading }) =>
    loading &&
    css`
      opacity: 0;
    `}
`;

const SourcesItem = styled.div`
  border-bottom: 1px solid ${(props) => props.theme.text_main};
  margin: 0px;
  width: 100%;

  &:first-child {
    height: 40px;
    border-bottom: 1px solid ${(props) => props.theme.text_main} !important;
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
`;

const ContentContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    text-align: center;

  `
const SubContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    text-align: center;
  `

const Dashboard: React.FC = () => {
  const bigQueryIndexes = [
    { id: '', name: "BigQuery land_com_final" },
    { id: '', name: "BigQuery har_com_for_sale_transformed" },
    { id: '', name: "BigQuery har_com_sold_merge" },
    { id: '', name: "AI_Tools" },
  ]


  const [indexes, setIndexes] = useState<{ id: string; name: string; }[]>(bigQueryIndexes);
  const [queryText, setQueryText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [responseSources, setResponseSources] = useState<any[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [indexName, setIndexName] = useState(new Set(["Select Data Source"]));;
  const selectedIndexName = React.useMemo(
    () => Array.from(indexName).join(", "),
    [indexName]
  );
  const apiClient = useApiClient();

  useEffect(() => {
    fetchIndexes();
  }, []);

  const processIndexes = (data: any[]) => {
    return data.map((index) => ({ id: index.pk, name: index.fields.name, }));
  };

  const fetchIndexes = async () => {
    try {
      const response = await apiClient.makeRequest('GET', `/llm_integration/indexes/by-user-id/`);
      if (response && response.data) {
        const processedIndexes = processIndexes(response.data)
        const finalIndexes = [...bigQueryIndexes, ...processedIndexes]
        setIndexes(finalIndexes);
      }
    } catch (error) {
      console.error(error);
    }
  };


  const sourceElems = responseSources.map((source) => {
    if (source.text) {
      const nodeText = source.text.length > 400 ? source.text.substring(0, 350) + '...' : source.text;

      return (
        <SourcesItem>
          <p className="text">{nodeText}</p>
          <p className="footer">
            Similarity={source.similarity}, start={source.start}, end={source.end}
          </p>
        </SourcesItem>
      )
    }
    else {
      return (
        <SourcesItem>
          <p className="text">SQL Result={source.sql_result}</p>
          <p className="text">
            SQL Query={source.sql_query}
          </p>
        </SourcesItem>
      )
    }
  });

  const handleQuerySubmit = async () => {
    try {
      setLoading(true);
      const response = await apiClient.makeRequest(
        'GET',
        `/llm_integration/query-index?text=${queryText}&index_name=${selectedIndexName}`
      );
      if (response) {
        const data = response.data;
        setResponseText(data.text);
        setResponseSources(data.sources);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout isAuthenticated={authCheck()} isSplashPage={true}>
      <DashboardContainer>

        <Dropdown>
          <Dropdown.Button color="primary" css={{ width: "300px", textAlign: "start", }}>
            {selectedIndexName !== 'Select Data Source' ? <>Data Source: {selectedIndexName}</> : <>{selectedIndexName}</>}
          </Dropdown.Button>
          <Dropdown.Menu
            aria-label="Single selection actions"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={indexName}
            items={indexes}
            onSelectionChange={setIndexName}
            css={{ $$dropdownMenuWidth: "500px" }}
          >
            {(item) => (
              <Dropdown.Item
                key={item.name}
              >
                {item.name}
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
        {selectedIndexName !== 'Select Data Source' ? (<ContentContainer>
          <SubContentContainer>

            <h4>Query Data Source</h4>
            <Input css={{ width: "50vw" }} name='queryText' id='queryText' aria-label='queryText' aria-describedby='queryText' required={true} placeholder='Your Question' type="text" value={queryText} onChange={(e) => setQueryText(e.target.value)} />
            <Spacer y={0.5} />


            {
              isLoading ?
                <Button css={{ width: "50vw" }} disabled>
                  <Loading type="points" color="currentColor" size="sm" />
                </Button>
                : <Button css={{ width: "50vw" }} onClick={handleQuerySubmit}>
                  <>Submit Question </>
                </Button>
            }


            <Spacer y={0.5} />

            <div>
              <ResultsDiv loading={isLoading}>
                <h4 className="id">Query Response</h4>
                {responseText}
              </ResultsDiv>
              <Spacer y={0.5} />

              <SourcesDiv loading={isLoading}>
                <h4 className="id">Response Sources</h4>
                {sourceElems}
              </SourcesDiv>
            </div>
          </SubContentContainer>

          {selectedIndexName === 'AI_Tools' || selectedIndexName.startsWith('BigQuery') ? <></> :
            <SubContentContainer>
              <Spacer y={0.5} />
              <h4>Upload Your Data</h4>
              {selectedIndexName !== '' ? <DocumentTools index={selectedIndexName}></DocumentTools> : <a>Select an index to insert into</a>}
            </SubContentContainer>
          }
        </ContentContainer>) : <></>}


      </DashboardContainer>
    </Layout>
  );
};

export default Dashboard;
