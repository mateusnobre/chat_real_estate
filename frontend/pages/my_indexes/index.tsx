import { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import { authCheck } from '../../utils/auth';
import useApiClient from '../../helpers/api';
import styled from 'styled-components';
import React from 'react';
import { Button, Loading, Spacer } from '@nextui-org/react';
import { Input } from '@nextui-org/react';

const MyIndexes = () => {
    const [indexes, setIndexes] = useState<{ id: string; name: string; }[]>([]);
    const [newIndexName, setNewIndexName] = useState('');
    const apiClient = useApiClient();
    const [isLoadingCreateIndex, setIsLoadingCreateIndex] = useState(false);
    const [isLoadingDeleteIndex, setIsLoadingDeleteIndex] = useState(false);

    useEffect(() => {
        fetchIndexes();
    }, []);

    const processIndexes = (data: any[]) => {
        return data.map((index) => ({ id: index.pk, name: index.fields.name }));
    };

    const fetchIndexes = async () => {
        try {
            const response = await apiClient.makeRequest('GET', `/llm_integration/indexes/by-user-id/`);
            if (response && response.data) {
                setIndexes(processIndexes(response.data));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateIndex = async () => {
        setIsLoadingCreateIndex(true);

        try {
            if (newIndexName === "") {
                window.alert("Insert a valid data source name")
                return
            }
            const data = { name: newIndexName };
            const response = await apiClient.makeRequest('POST', '/llm_integration/indexes/create/', data);
            if (response) {
                setIndexes([...indexes, ...processIndexes(response.data)]);
                setNewIndexName('');
            }
        } catch (error) {
            console.error(error);
        }
        await fetchIndexes();
        setIsLoadingCreateIndex(false);

    };

    const handleDeleteIndex = async (indexId: string) => {
        setIsLoadingDeleteIndex(true);

        if (window.confirm('Are you sure you want to delete this agent?')) {
            try {
                await apiClient.makeRequest('DELETE', `/llm_integration/indexes/delete/${indexId}/`);
                setIndexes(indexes.filter((index) => index.id !== indexId));
            } catch (error) {
                console.error(error);
            }
            await fetchIndexes();
            setIsLoadingDeleteIndex(false);
        } else {
            setIsLoadingDeleteIndex(false);
            return;
        }
    };

    return (
        <Layout isAuthenticated={authCheck()} isSplashPage={true}>
            <div
                className="my_indexes"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-around',
                    width: '100%',
                    height: '70vh',
                    paddingTop: '40px'
                }}
            >
                <h2>My Data Sources</h2>
                <Spacer y={0.5} />

                <h3>Create New Data Source</h3>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-around',
                        width: '100%',
                    }}
                >
                    <Input type="text" placeholder='Name' value={newIndexName} onChange={(e) => setNewIndexName(e.target.value)} />
                    <Spacer y={0.5} />
                    {
                        isLoadingCreateIndex ?
                            <Button disabled >
                                <Loading type="points" color="currentColor" size="sm" />
                            </Button>
                            : <Button auto onClick={handleCreateIndex}>
                                <>Create </>
                            </Button>
                    }
                </div>
                <Spacer y={0.5} />

                <h3>Existing Data Sources</h3>
                {indexes.map((index) => (
                    <>
                        <IndexItem key={index.id}>
                            <h4>{index.name}</h4>
                            {
                                isLoadingDeleteIndex ?
                                    <Button disabled >
                                        <Loading type="points" color="currentColor" size="sm" />
                                    </Button>
                                    : <Button auto onClick={() => handleDeleteIndex(index.id)}>
                                        <>Delete </>
                                    </Button>
                            }
                        </IndexItem>
                        <Spacer y={0.5} />

                    </>


                ))}
            </div>
        </Layout >
    );
};

const IndexItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  width: 100%;
  border: 1px solid black;
  border-radius: 5px;
`;

export default MyIndexes;
