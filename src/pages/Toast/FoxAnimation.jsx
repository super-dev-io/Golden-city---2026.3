/**
 * Fox Appear Animation Component
 * Uses the same Rive animation as MetaMask extension
 */
import React, { useEffect } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas';
import { useRiveWasmContext } from '../../contexts/rive-wasm';
import './MM.css';

export default function FoxAnimation({
  isLoader = false,
  skipTransition = false,
}) {
  const { isWasmReady, error: wasmError } = useRiveWasmContext();

  console.log('[FoxAnimation] mount', { isWasmReady });

  useEffect(() => {
    if (wasmError) {
      console.error('[Rive - FoxAppearAnimation] Failed to load WASM:', wasmError);
    }
  }, [wasmError]);

  // Build options object only when WASM is ready to let the hook initialize properly
  const riveOptions = isWasmReady
    ? {
        src: '/images/riv_animations/fox_appear.riv',
        stateMachines: 'FoxRaiseUp',
        autoplay: false,
        layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      }
    : undefined;

  const { rive, RiveComponent } = useRive(riveOptions);

  useEffect(() => {
    console.debug('[FoxAnimation] isWasmReady changed', { isWasmReady });
  }, [isWasmReady]);

  // Trigger the animation start when rive is loaded and WASM is ready
  useEffect(() => {
    console.log('[FoxAnimation] useEffect trigger', { isWasmReady, rive, RiveComponent });
    if (!rive || typeof rive.stateMachineInputs !== 'function' || !isWasmReady) return;
    try {
      const inputs = rive.stateMachineInputs('FoxRaiseUp');
      if (!inputs) return;

      if (skipTransition) {
        const wiggleTrigger = inputs.find((input) => input.name === 'Wiggle');
        if (wiggleTrigger) wiggleTrigger.fire();
      } else {
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) startTrigger.fire();
      }

      if (isLoader) {
        const loaderTrigger = inputs.find((input) => input.name === 'Loader2');
        if (loaderTrigger) loaderTrigger.fire();
      }

      rive.play();
    } catch (error) {
      console.error('[Rive - FoxAppearAnimation] Error triggering animation:', error);
    }
  }, [rive, isWasmReady, skipTransition, isLoader]);

  if (!isWasmReady || !RiveComponent) {
    return (
      <div className="metamask-login-modal__fox-graphic">
        {/* Visible placeholder so the area is visible while Rive boots */}
        <div style={{width:120, height:120, background:'#f2f2f2', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <span style={{color:'#888'}}>Fox</span>
        </div>
        {isLoader && <div className="riv-animation__spinner">Loading...</div>}
        {RiveComponent && !rive && (
          <div style={{position:'absolute', bottom:8, fontSize:12, color:'#666'}}>Rive initializing...</div>
        )}
      </div>
    );
  }

  return (
    <div className="metamask-login-modal__fox-graphic">
      <RiveComponent className="riv-animation__canvas" />
      {isLoader && <div className="riv-animation__spinner">Loading...</div>}
    </div>
  );
}


