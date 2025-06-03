import * as React from 'react';
import { create as createStoreForReactiveGlobals } from 'zustand';
import { useQuery } from '@tanstack/react-query';

import { Box, Typography, useColorScheme } from '@mui/joy';

import { isBrowser } from '~/common/util/pwaUtils';
import { themeCodeFontFamilyCss, themeFontFamilyCss } from '~/common/app.theme';

import { diagramErrorSx, diagramSx } from './RenderCodePlantUML';
import { patchSvgString } from './RenderCodeSVG';


/**
 * We are loading Mermaid from the CDN (and spending all the work to dynamically load it
 * and strong type it), because the Mermaid dependencies (npm i mermaid) are too heavy
 * and would slow down development for everyone.
 *
 * If you update this file, also make sure the interfaces/type definitions and initialization
 * options are updated accordingly.
 */
const MERMAID_CDN_FILE: string = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js';

interface MermaidAPI {
  initialize: (config: any) => void;
  render: (id: string, text: string, svgContainingElement?: Element) => Promise<{ svg: string, bindFunctions?: (element: Element) => void }>;
}

// extend the Window interface, to allow for the mermaid API to be found
declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    mermaid: MermaidAPI;
  }
}

interface MermaidAPIStore {
  mermaidAPI: MermaidAPI | null,
  loadingError: string | null,
}

const useMermaidStore = createStoreForReactiveGlobals<MermaidAPIStore>()(
  () => ({
    mermaidAPI: null,
    loadingError: null,
  }),
);

let loadingStarted: boolean = false;
let loadingError: string | null = null;


function _loadMermaidFromCDN() {
  if (isBrowser && !loadingStarted) {
    loadingStarted = true;
    const script = document.createElement('script');
    script.src = MERMAID_CDN_FILE;
    script.defer = true;
    script.onload = () => {
      useMermaidStore.setState({
        mermaidAPI: _initializeMermaid(window.mermaid, false), // Default to light mode initially
        loadingError: null,
      });
    };
    script.onerror = () => {
      useMermaidStore.setState({
        mermaidAPI: null,
        loadingError: `Script load error for ${script.src}`,
      });
    };
    document.head.appendChild(script);
  }
}

/**
 * Pass the current font families at loading time. Note that the font families will be compiled by next to something like this:
 * - code: "'__JetBrains_Mono_dc2b2d', '__JetBrains_Mono_Fallback_dc2b2d', monospace",
 * - text: "'__Inter_1870e5', '__Inter_Fallback_1870e5', Helvetica, Arial, sans-serif"
 */
function _initializeMermaid(mermaidAPI: MermaidAPI, isDarkMode: boolean = false): MermaidAPI {
  // Create custom theme variables based on app's color scheme
  const customThemeVariables = isDarkMode ? {
    // Dark mode theme variables
    primaryColor: '#311A35',
    primaryTextColor: '#FFFFFF',
    primaryBorderColor: '#311A35',
    lineColor: '#9FA6AD',
    sectionBkgColor: '#171A1C',
    altSectionBkgColor: '#311A35',
    gridColor: '#636B74',
    secondaryColor: '#636B74',
    tertiaryColor: '#9FA6AD',
    background: '#0B0D0E',
    mainBkg: '#171A1C',
    secondBkg: '#311A35',
    tertiaryBkg: '#636B74',
    textColor: '#FFFFFF',
    errorBkgColor: '#da3633',
    errorTextColor: '#FFFFFF',
    // Flowchart specific
    nodeBkg: '#171A1C',
    nodeBorder: '#311A35',
    clusterBkg: '#311A35',
    clusterBorder: '#636B74',
    defaultLinkColor: '#9FA6AD',
    titleColor: '#FFFFFF',
    edgeLabelBackground: '#171A1C',
    // Git graph specific
    git0: '#311A35',
    git1: '#636B74',
    git2: '#9FA6AD',
    git3: '#F6F6F6',
    git4: '#FFFFFF',
    gitBranchLabel0: '#FFFFFF',
    gitBranchLabel1: '#FFFFFF',
    gitBranchLabel2: '#FFFFFF',
    gitBranchLabel3: '#311A35',
    gitBranchLabel4: '#311A35',
    // Sequence diagram specific
    actorBkg: '#171A1C',
    actorBorder: '#311A35',
    actorTextColor: '#FFFFFF',
    actorLineColor: '#636B74',
    signalColor: '#FFFFFF',
    signalTextColor: '#FFFFFF',
    labelBoxBkgColor: '#311A35',
    labelBoxBorderColor: '#636B74',
    labelTextColor: '#FFFFFF',
    loopTextColor: '#FFFFFF',
    noteBkgColor: '#636B74',
    noteBorderColor: '#9FA6AD',
    noteTextColor: '#FFFFFF',
    activationBkgColor: '#311A35',
    activationBorderColor: '#636B74',
  } : {
    // Light mode theme variables
    primaryColor: '#311A35',
    primaryTextColor: '#311A35',
    primaryBorderColor: '#311A35',
    lineColor: '#636B74',
    sectionBkgColor: '#F6F6F6',
    altSectionBkgColor: '#311A35',
    gridColor: '#9FA6AD',
    secondaryColor: '#9FA6AD',
    tertiaryColor: '#636B74',
    background: '#FFFFFF',
    mainBkg: '#FFFFFF',
    secondBkg: '#F6F6F6',
    tertiaryBkg: '#9FA6AD',
    textColor: '#311A35',
    errorBkgColor: '#da3633',
    errorTextColor: '#FFFFFF',
    // Flowchart specific
    nodeBkg: '#FFFFFF',
    nodeBorder: '#311A35',
    clusterBkg: '#F6F6F6',
    clusterBorder: '#636B74',
    defaultLinkColor: '#311A35',
    titleColor: '#311A35',
    edgeLabelBackground: '#FFFFFF',
    // Git graph specific
    git0: '#311A35',
    git1: '#636B74',
    git2: '#9FA6AD',
    git3: '#F6F6F6',
    git4: '#FFFFFF',
    gitBranchLabel0: '#311A35',
    gitBranchLabel1: '#311A35',
    gitBranchLabel2: '#311A35',
    gitBranchLabel3: '#311A35',
    gitBranchLabel4: '#311A35',
    // Sequence diagram specific
    actorBkg: '#FFFFFF',
    actorBorder: '#311A35',
    actorTextColor: '#311A35',
    actorLineColor: '#636B74',
    signalColor: '#311A35',
    signalTextColor: '#311A35',
    labelBoxBkgColor: '#311A35',
    labelBoxBorderColor: '#636B74',
    labelTextColor: '#FFFFFF',
    loopTextColor: '#311A35',
    noteBkgColor: '#F6F6F6',
    noteBorderColor: '#636B74',
    noteTextColor: '#311A35',
    activationBkgColor: '#F6F6F6',
    activationBorderColor: '#311A35',
  };

  mermaidAPI.initialize({
    startOnLoad: false,

    // gfx options
    fontFamily: themeCodeFontFamilyCss,
    altFontFamily: themeFontFamilyCss,

    // style configuration
    htmlLabels: true,
    securityLevel: 'loose',
    theme: 'base', // Use base theme to allow custom variables
    themeVariables: customThemeVariables,

    // per-chart configuration
    mindmap: { useMaxWidth: false },
    flowchart: { useMaxWidth: false },
    sequence: { useMaxWidth: false },
    timeline: { useMaxWidth: false },
    class: { useMaxWidth: false },
    state: { useMaxWidth: false },
    pie: { useMaxWidth: false },
    er: { useMaxWidth: false },
    gantt: { useMaxWidth: false },
    gitGraph: { useMaxWidth: false },
  });
  return mermaidAPI;
}

function useMermaidLoader() {
  const { mermaidAPI } = useMermaidStore();
  const { mode: colorMode } = useColorScheme();
  const isDarkMode = colorMode === 'dark';

  React.useEffect(() => {
    if (!mermaidAPI)
      _loadMermaidFromCDN();
    else {
      // Re-initialize when color mode changes
      _initializeMermaid(mermaidAPI, isDarkMode);
    }
  }, [mermaidAPI, isDarkMode]);

  return { mermaidAPI, isSuccess: !!mermaidAPI, hasStartedLoading: loadingStarted, error: loadingError };
}

type MermaidResult =
  | { success: true; svg: string }
  | { success: false; error: string };


export function RenderCodeMermaid(props: { mermaidCode: string, fitScreen: boolean }) {

  // state
  const mermaidContainerRef = React.useRef<HTMLDivElement>(null);

  // external state
  const { mermaidAPI, error: mermaidLoadError } = useMermaidLoader();
  const { mode: colorMode } = useColorScheme();

  // [effect] re-render on code changes
  const { data } = useQuery<MermaidResult>({
    enabled: !!mermaidAPI && !!props.mermaidCode,
    queryKey: ['mermaid', props.mermaidCode, colorMode],
    queryFn: async (): Promise<MermaidResult> => {
      try {
        const elementId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaidAPI!.render(elementId, props.mermaidCode, mermaidContainerRef.current!);
        return svg ? { success: true, svg } : { success: false, error: 'No SVG returned.' };
      } catch (error: any) {
        return { success: false, error: error?.message ?? error?.toString() ?? 'unknown error' };
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 1 day
  });

  // derived
  const hasMermaidLoadError = !!mermaidLoadError;

  return (
    <Box component='div'>
      {data?.success === false && (
        <Typography level='body-sm' color='danger' variant='plain' sx={{ mb: 2, borderRadius: 'xs' }}>
          Unable to display diagram. Issue with the generated Mermaid code.
        </Typography>
      )}
      <Box
        component='div'
        ref={mermaidContainerRef}
        dangerouslySetInnerHTML={{
          __html:
            hasMermaidLoadError ? mermaidLoadError
              : data?.success === false ? data.error
                : patchSvgString(props.fitScreen, data?.svg) || 'Loading Diagram...',
        }}
        sx={data?.success === false ? diagramErrorSx : diagramSx}
      />
    </Box>
  );
}
