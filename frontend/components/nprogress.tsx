import React, { Component, useEffect } from 'react';
import NProgress from 'nprogress';
import Router from 'next/router';
import styled, { createGlobalStyle, css, keyframes } from 'styled-components';

interface NProgressOptions {
  minimum?: number;
  easing?: string;
  speed?: number;
  showSpinner?: boolean;
  trickle?: boolean;
  trickleSpeed?: number;
  parent?: string;
  template?: string;
  // Add more options if needed
}


interface NProgressContainerProps {
  color?: string;
  showAfterMs?: number;
  spinner?: boolean;
  options?: NProgressOptions;
}
const nprogressSpinnerAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const GlobalStyles = createGlobalStyle < NProgressContainerProps > `
  #nprogress {
    pointer-events: none;
  }

  #nprogress .bar {
    background: ${({ color }) => color || '#2299DD'};
    position: fixed;
    z-index: 1031;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
  }

  #nprogress .peg {
    display: block;
    position: absolute;
    right: 0px;
    width: 100px;
    height: 100%;
    box-shadow: 0 0 10px ${({ color }) => color || '#2299DD'},
      0 0 5px ${({ color }) => color || '#2299DD'};
    opacity: 1;
    transform: rotate(3deg) translate(0px, -4px);
  }

  #nprogress .spinner {
    display: ${({ spinner }) => (spinner ? 'block' : 'none')};
    position: fixed;
    z-index: 1031;
    top: 15px;
    right: 15px;
  }

  #nprogress .spinner-icon {
    width: 18px;
    height: 18px;
    box-sizing: border-box;
    border: solid 2px transparent;
    border-top-color: ${({ color }) => color || '#2299DD'};
    border-left-color: ${({ color }) => color || '#2299DD'};
    border-radius: 50%;
    animation: ${nprogressSpinnerAnimation} 400ms linear infinite;
  }

  .nprogress-custom-parent {
    overflow: hidden;
    position: relative;
  }

  .nprogress-custom-parent #nprogress .spinner,
  .nprogress-custom-parent #nprogress .bar {
    position: absolute;
  }
`;


const NProgressContainer: React.FC<NProgressContainerProps> = ({
  color = '#2299DD',
  showAfterMs = 300,
  spinner = true,
  options,
}) => {
  let timer: NodeJS.Timeout | null = null;

  const routeChangeStart = () => {
    clearTimeout(timer as NodeJS.Timeout);
    timer = setTimeout(NProgress.start, showAfterMs);
  };

  const routeChangeEnd = () => {
    clearTimeout(timer as NodeJS.Timeout);
    NProgress.done();
  };

  useEffect(() => {
    if (options) {
      NProgress.configure(options);
    }

    Router.events.on('routeChangeStart', routeChangeStart);
    Router.events.on('routeChangeComplete', routeChangeEnd);
    Router.events.on('routeChangeError', routeChangeEnd);

    return () => {
      clearTimeout(timer as NodeJS.Timeout);
      Router.events.off('routeChangeStart', routeChangeStart);
      Router.events.off('routeChangeComplete', routeChangeEnd);
      Router.events.off('routeChangeError', routeChangeEnd);
    };
  }, []);

  return <GlobalStyles color={color} spinner={spinner} />;
};

export default NProgressContainer;
