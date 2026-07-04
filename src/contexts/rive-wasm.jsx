/**
 * Simplified Rive WASM context for standalone project
 * Based on MetaMask extension's rive-wasm context
 */
import { RuntimeLoader } from '@rive-app/react-canvas';
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

// WASM file URL
const RIVE_WASM_URL = '/images/riv_animations/rive.wasm';

const RiveWasmContext = createContext({
  isWasmReady: false,
  loading: false,
  error: undefined,
  urlBufferMap: {},
  setUrlBufferCache: () => {},
});

export function RiveWasmProvider({ children }) {
  const [isWasmReady, setIsWasmReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(undefined);
  const [urlBufferMap, setUrlBufferMap] = useState({});

  useEffect(() => {
    const loadWasm = async () => {
      try {
        if (typeof RuntimeLoader === 'undefined') {
          setIsWasmReady(true);
          setLoading(false);
          return;
        }

        const response = await fetch(RIVE_WASM_URL);
        if (!response.ok) {
          throw new Error(
            `HTTP error! status while fetching rive.wasm: ${response.status}`,
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        // Set WASM binary - TypeScript cast equivalent
        if (RuntimeLoader) {
          RuntimeLoader.wasmBinary = arrayBuffer;
          RuntimeLoader.setWasmUrl('should not fetch wasm');
        }

        // Preload the WASM
        await RuntimeLoader.awaitInstance();
        setIsWasmReady(true);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    loadWasm();
  }, []);

  const setUrlBufferCache = useCallback(
    (url, buffer) => {
      setUrlBufferMap((prev) => ({ ...prev, [url]: buffer }));
    },
    [],
  );

  return (
    <RiveWasmContext.Provider
      value={{
        isWasmReady,
        loading,
        error,
        urlBufferMap,
        setUrlBufferCache,
      }}
    >
      {children}
    </RiveWasmContext.Provider>
  );
}

export const useRiveWasmContext = () => {
  const context = useContext(RiveWasmContext);
  if (!context) {
    throw new Error('useRiveWasmContext must be used within RiveWasmProvider');
  }
  return context;
};

export const useRiveWasmFile = (url) => {
  const { isWasmReady, urlBufferMap, setUrlBufferCache } = useRiveWasmContext();
  const [buffer, setBuffer] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);

  const cachedBuffer = urlBufferMap[url];

  useEffect(() => {
    const loadFile = async () => {
      if (!isWasmReady) {
        return;
      }
      if (cachedBuffer) {
        setBuffer(cachedBuffer);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}, url: ${url}`);
        }
        const newArrayBuffer = await response.arrayBuffer();
        setUrlBufferCache(url, newArrayBuffer);
        setBuffer(newArrayBuffer);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    loadFile();
  }, [isWasmReady, url, setUrlBufferCache, cachedBuffer]);

  return { buffer, loading, error };
};

