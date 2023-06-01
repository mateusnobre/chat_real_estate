import React from 'react';
import styled from 'styled-components';
const AppHeader = styled.header`
  display: flex;
  flex-direction: row;
  height: 250px;
  width: 80%;
`
const AppHeaderMain = styled.div`
    display: flex;
    align-items: flex-end;
    width: 25%;
    background-color: ${props => props.theme.header_big_block};
    color:  ${props => props.theme.text_contrast};

    p {
      width: 100%;
      text-align: center;
      margin: 0;
      font-size: 35px;
      font-weight: 900;
      padding-bottom: 3px;
    }
`

const AppHeaderSub = styled.div`
    display: flex;
    align-items: flex-end;
    width: 75%;
    color: ${props => props.theme.text_main};

    div {
      display: flex;
      align-items: flex-end;
      padding-left: 25px;
      width: 100%;
      // position: absolute;
      height: 80px;
      background-color: ${props => props.theme.header_narrow_block};
      p {
        text-align: left;
        margin: 0;
        font-size: 25px;
        font-weight: 400;
        padding-bottom: 5px;
        letter-spacing: 3px;
      }
    }
`

const Header = () => {
  return (
    <AppHeader>
      <AppHeaderMain>
        <p>Chat <br></br> Real Estate</p>
      </AppHeaderMain>
      <AppHeaderSub>
        <div>
          <p>Query Documents (PDF, Web Page and TXT) and Databases (BigQuery)</p>
        </div>
      </AppHeaderSub>
    </AppHeader>
  );
};

export default Header;
