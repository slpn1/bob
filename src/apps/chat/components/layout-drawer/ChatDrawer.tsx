import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSession, signOut } from 'next-auth/react';

import { Box, Button, Dropdown, IconButton, ListDivider, ListItem, ListItemButton, ListItemDecorator, Menu, MenuButton, MenuItem, Tooltip, Typography, Avatar } from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FolderIcon from '@mui/icons-material/Folder';
import FormatPaintOutlinedIcon from '@mui/icons-material/FormatPaintOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';

import type { DConversationId } from '~/common/stores/chat/chat.conversation';
import { CloseablePopup } from '~/common/components/CloseablePopup';
import { DFolder, useFolderStore } from '~/common/stores/folders/store-chat-folders';
import { DebouncedInputMemo } from '~/common/components/DebouncedInput';
import { FoldersToggleOff } from '~/common/components/icons/FoldersToggleOff';
import { FoldersToggleOn } from '~/common/components/icons/FoldersToggleOn';
import { LogoutButton } from '~/common/components/LogoutButton';
import { OPTIMA_DRAWER_BACKGROUND } from '~/common/layout/optima/optima.config';
import { OptimaDrawerHeader } from '~/common/layout/optima/drawer/OptimaDrawerHeader';
import { OptimaDrawerList } from '~/common/layout/optima/drawer/OptimaDrawerList';
import { capitalizeFirstLetter } from '~/common/util/textUtils';
import { getIsMobile } from '~/common/components/useMatchMedia';
import { optimaCloseDrawer, optimaOpenModels, optimaOpenPreferences } from '~/common/layout/optima/useOptima';
import { themeScalingMap, themeZIndexOverMobileDrawer } from '~/common/app.theme';
import { useUIPreferencesStore } from '~/common/state/store-ui';
import { useIsAdmin } from '~/common/util/auth-utils';

import { ChatDrawerItemMemo, FolderChangeRequest } from './ChatDrawerItem';
import { ChatFolderList } from './folders/ChatFolderList';
import { ChatNavGrouping, ChatSearchDepth, ChatSearchSorting, isDrawerSearching, useChatDrawerRenderItems } from './useChatDrawerRenderItems';
import { ClearFolderText } from '../layout-bar/useFolderDropdown';
import { useChatDrawerFilters } from '../../store-app-chat';


// this is here to make shallow comparisons work on the next hook
const noFolders: DFolder[] = [];

/**
 * Component to display user info and logout button
 */
function UserInfoAndLogout() {
  const { data: session, status } = useSession();
  
  // If not authenticated, show login button
  if (status === 'unauthenticated') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Button 
          variant="soft" 
          color="primary" 
          size="sm" 
          component="a"
          href="/api/auth/signin"
        >
          Sign in
        </Button>
      </Box>
    );
  }
  
  // If loading, show loading state
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
          Loading...
        </Typography>
      </Box>
    );
  }
  
  // If authenticated, show user info and logout button
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
        <Avatar
          size="sm"
          variant="soft"
          color="primary"
          sx={{ '--Avatar-size': '28px' }}
        >
          {session?.user?.name?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Typography 
          level="body-sm" 
          sx={{ 
            fontWeight: 'md',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {session?.user?.name || 'User'}
        </Typography>
      </Box>
      <Button 
        variant="soft" 
        color="neutral" 
        size="sm" 
        onClick={() => signOut({ callbackUrl: '/api/auth/signin' })}
        startDecorator={<LogoutIcon fontSize="small" />}
      >
        Sign out
      </Button>
    </Box>
  );
}

/*
 * Lists folders and returns the active folder
 */
export const useFolders = (activeFolderId: string | null) => useFolderStore(useShallow(({ enableFolders, folders, toggleEnableFolders }) => {

  // finds the active folder if any
  const activeFolder = (enableFolders && activeFolderId)
    ? folders.find(folder => folder.id === activeFolderId) ?? null
    : null;

  return {
    activeFolder,
    allFolders: enableFolders ? folders : noFolders,
    enableFolders,
    toggleEnableFolders,
  };
}));


export const ChatDrawerMemo = React.memo(ChatDrawer);

function ChatDrawer(props: {
  activeConversationId: DConversationId | null,
  activeFolderId: string | null,
  chatPanesConversationIds: DConversationId[],
  disableNewButton: boolean,
  onConversationActivate: (conversationId: DConversationId) => void,
  onConversationBranch: (conversationId: DConversationId, messageId: string | null, addSplitPane: boolean) => void,
  onConversationNew: (forceNoRecycle: boolean, isIncognito: boolean) => void,
  onConversationsDelete: (conversationIds: DConversationId[], bypassConfirmation: boolean) => void,
  onConversationsExportDialog: (conversationId: DConversationId | null, exportAll: boolean) => void,
  onConversationsImportDialog: () => void,
  setActiveFolderId: (folderId: string | null) => void,
}) {

  const { onConversationActivate, onConversationBranch, onConversationNew, onConversationsDelete, onConversationsExportDialog } = props;

  // local state
  const [navGrouping, setNavGrouping] = React.useState<ChatNavGrouping>('date');
  const [searchSorting, setSearchSorting] = React.useState<ChatSearchSorting>('date');
  const [searchDepth, setSearchDepth] = React.useState<ChatSearchDepth>('attachments'); // default: full search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');
  const [folderChangeRequest, setFolderChangeRequest] = React.useState<FolderChangeRequest | null>(null);

  // external state
  const {
    clearFilters,
    filterHasDocFragments, toggleFilterHasDocFragments,
    filterHasImageAssets, toggleFilterHasImageAssets,
    filterHasStars, toggleFilterHasStars,
    showPersonaIcons, toggleShowPersonaIcons,
    showRelativeSize, toggleShowRelativeSize,
  } = useChatDrawerFilters();
  const { activeFolder, allFolders, enableFolders, toggleEnableFolders } = useFolders(props.activeFolderId);
  const { filteredChatsCount, filteredChatIDs, filteredChatsAreEmpty, filteredChatsBarBasis, filteredChatsIncludeActive, renderNavItems } = useChatDrawerRenderItems(
    props.activeConversationId, props.chatPanesConversationIds, debouncedSearchQuery, activeFolder, allFolders, filterHasStars, filterHasImageAssets, filterHasDocFragments, navGrouping, searchSorting, showRelativeSize, searchDepth,
  );
  const [uiComplexityMode, contentScaling] = useUIPreferencesStore(useShallow((state) => [state.complexityMode, state.contentScaling]));
  const zenMode = uiComplexityMode === 'minimal';
  const gifMode = uiComplexityMode === 'extra';

  // Use the centralized useIsAdmin hook
  const isAdmin = useIsAdmin();

  // New/Activate/Delete Conversation

  const isMultiPane = props.chatPanesConversationIds.length >= 2;
  const disableNewButton = props.disableNewButton && filteredChatsIncludeActive;
  const newButtonDontRecycle = isMultiPane || !filteredChatsIncludeActive;

  const handleButtonNew = React.useCallback((event: React.MouseEvent) => {
    // FIXME: undocumented: shift+click to force incognito mode
    onConversationNew(newButtonDontRecycle, event.shiftKey);
    if (getIsMobile())
      optimaCloseDrawer();
  }, [newButtonDontRecycle, onConversationNew]);

  const handleConversationActivate = React.useCallback((conversationId: DConversationId, closeMenu: boolean) => {
    onConversationActivate(conversationId);
    if (closeMenu && getIsMobile())
      optimaCloseDrawer();
  }, [onConversationActivate]);

  const handleConversationsDeleteFiltered = React.useCallback(() => {
    !!filteredChatIDs?.length && onConversationsDelete(filteredChatIDs, false);
  }, [filteredChatIDs, onConversationsDelete]);

  const handleConversationDeleteNoConfirmation = React.useCallback((conversationId: DConversationId) => {
    conversationId && onConversationsDelete([conversationId], true);
  }, [onConversationsDelete]);

  const handleConversationsExport = React.useCallback(() => {
    props.activeConversationId && onConversationsExportDialog(props.activeConversationId, true);
  }, [onConversationsExportDialog, props.activeConversationId]);


  // Folder change request

  const handleConversationFolderChange = React.useCallback((folderChangeRequest: FolderChangeRequest) => setFolderChangeRequest(folderChangeRequest), []);

  const handleConversationFolderCancel = React.useCallback(() => setFolderChangeRequest(null), []);

  const handleConversationFolderSet = React.useCallback((conversationId: DConversationId, nextFolderId: string | null) => {
    // Remove conversation from existing folders
    const { addConversationToFolder, folders, removeConversationFromFolder } = useFolderStore.getState();
    folders.forEach(folder => folder.conversationIds.includes(conversationId) && removeConversationFromFolder(folder.id, conversationId));

    // Add conversation to the selected folder
    nextFolderId && addConversationToFolder(nextFolderId, conversationId);

    // Close the menu
    setFolderChangeRequest(null);
  }, []);


  // memoize the group dropdown
  const { isSearching } = isDrawerSearching(debouncedSearchQuery);
  const groupingComponent = React.useMemo(() => (
    <Dropdown>
      <MenuButton
        aria-label='View options'
        slots={{ root: IconButton }}
        slotProps={{ root: { size: 'sm' } }}
      >
        <MoreVertIcon />
      </MenuButton>

      {!isSearching ? (
        // Search/Filter default menu: Grouping, Filtering, ...
        <Menu placement='bottom-start' sx={{ minWidth: 200, zIndex: themeZIndexOverMobileDrawer /* need to be on top of the Modal on Mobile */ }}>
          <ListItem>
            <Typography level='body-sm'>Group By</Typography>
          </ListItem>
          {(['date', 'persona', 'dimension'] as Exclude<ChatNavGrouping, false>[]).map(_gName => (
            <MenuItem
              key={'group-' + _gName}
              aria-label={`Group by ${_gName}`}
              selected={navGrouping === _gName}
              onClick={() => setNavGrouping(grouping => grouping === _gName ? false : _gName)}
            >
              <ListItemDecorator>{navGrouping === _gName && <CheckRoundedIcon />}</ListItemDecorator>
              {capitalizeFirstLetter(_gName)}
            </MenuItem>
          ))}

          <ListDivider />
          <ListItem>
            <Typography level='body-sm'>Filter</Typography>
          </ListItem>
          <MenuItem onClick={toggleFilterHasStars}>
            <ListItemDecorator>{filterHasStars && <CheckRoundedIcon />}</ListItemDecorator>
            Starred <StarOutlineRoundedIcon />
          </MenuItem>
          <MenuItem onClick={toggleFilterHasImageAssets}>
            <ListItemDecorator>{filterHasImageAssets && <CheckRoundedIcon />}</ListItemDecorator>
            Has Images <FormatPaintOutlinedIcon />
          </MenuItem>
          <MenuItem onClick={toggleFilterHasDocFragments}>
            <ListItemDecorator>{filterHasDocFragments && <CheckRoundedIcon />}</ListItemDecorator>
            Has Attachments <AttachFileRoundedIcon />
          </MenuItem>

          <ListDivider />
          <ListItem>
            <Typography level='body-sm'>Show</Typography>
          </ListItem>
          <MenuItem onClick={toggleShowPersonaIcons}>
            <ListItemDecorator>{showPersonaIcons && <CheckRoundedIcon />}</ListItemDecorator>
            Icons
          </MenuItem>
          <MenuItem onClick={toggleShowRelativeSize}>
            <ListItemDecorator>{showRelativeSize && <CheckRoundedIcon />}</ListItemDecorator>
            Relative Size
          </MenuItem>
        </Menu>
      ) : (
        // While searching, show the sorting and depth options
        <Menu placement='bottom-start' sx={{ minWidth: 180, zIndex: themeZIndexOverMobileDrawer /* need to be on top of the Modal on Mobile */ }}>
          <ListItem>
            <Typography level='body-sm'>Sort By</Typography>
          </ListItem>
          <MenuItem selected={searchSorting === 'frequency'} onClick={() => setSearchSorting('frequency')}>
            <ListItemDecorator>{searchSorting === 'frequency' && <CheckRoundedIcon />}</ListItemDecorator>
            Matches
          </MenuItem>
          <MenuItem selected={searchSorting === 'date'} onClick={() => setSearchSorting('date')}>
            <ListItemDecorator>{searchSorting === 'date' && <CheckRoundedIcon />}</ListItemDecorator>
            Date
          </MenuItem>
          <ListDivider />
          <ListItem>
            <Typography level='body-sm'>Search In</Typography>
          </ListItem>
          <MenuItem selected={searchDepth === 'titles'} onClick={() => setSearchDepth('titles')}>
            <ListItemDecorator>{searchDepth === 'titles' && <CheckRoundedIcon />}</ListItemDecorator>
            Titles
          </MenuItem>
          <MenuItem selected={searchDepth === 'content'} onClick={() => setSearchDepth('content')}>
            <ListItemDecorator>{searchDepth === 'content' && <CheckRoundedIcon />}</ListItemDecorator>
            Titles + Content
          </MenuItem>
          <MenuItem selected={searchDepth === 'attachments'} onClick={() => setSearchDepth('attachments')}>
            <ListItemDecorator>{searchDepth === 'attachments' && <CheckRoundedIcon />}</ListItemDecorator>
            Full
          </MenuItem>
        </Menu>
      )}
    </Dropdown>
  ), [
    filterHasDocFragments, filterHasImageAssets, filterHasStars, isSearching, navGrouping, searchSorting, searchDepth, showPersonaIcons, showRelativeSize,
    toggleFilterHasDocFragments, toggleFilterHasImageAssets, toggleFilterHasStars, toggleShowPersonaIcons, toggleShowRelativeSize,
  ]);


  return <>

    {/* Drawer Header */}
    <OptimaDrawerHeader title='Chats' onClose={() => {}}>
      {/* <Tooltip title={enableFolders ? 'Hide Folders' : 'Use Folders'}>
        <IconButton size='sm' onClick={toggleEnableFolders}>
          {enableFolders ? <FoldersToggleOn /> : <FoldersToggleOff />}
        </IconButton>
      </Tooltip> */}
    </OptimaDrawerHeader>

    {/* Folders List (shrink at twice the rate as the Titles) */}
    {/*<Box sx={{*/}
    {/*  display: 'grid',*/}
    {/*  gridTemplateRows: !enableFolders ? '0fr' : '1fr',*/}
    {/*  transition: 'grid-template-rows 0.42s cubic-bezier(.17,.84,.44,1)',*/}
    {/*  '& > div': {*/}
    {/*    padding: enableFolders ? 2 : 0,*/}
    {/*    transition: 'padding 0.42s cubic-bezier(.17,.84,.44,1)',*/}
    {/*    overflow: 'hidden',*/}
    {/*  },*/}
    {/*}}>*/}
    {enableFolders && (
      <ChatFolderList
        folders={allFolders}
        contentScaling={contentScaling}
        activeFolderId={props.activeFolderId}
        onFolderSelect={props.setActiveFolderId}
        sx={{
          // shrink this at twice the rate as the Titles list
          flexGrow: 0, flexShrink: 2, overflow: 'hidden',
          minHeight: '7.5rem',
          p: 2,
        }}
      />
    )}
    {/*</Box>*/}

    {/* Chats List */}
    <OptimaDrawerList variant='plain' noTopPadding noBottomPadding tallRows>

      {/* {enableFolders && <ListDivider sx={{ mb: 0 }} />} */}

      {/* Search / New Chat */}
      <Box sx={{ display: 'flex', flexDirection: 'column', m: 0, gap: 2 }}>

        {/* Search Input Field */}
        <DebouncedInputMemo
          minChars={2}
          onDebounce={setDebouncedSearchQuery}
          debounceTimeout={300}
          placeholder='Search'
          aria-label='Search'
          endDecorator={groupingComponent}
          sx={{
            mt: 4,
            mx: 4,
            borderRadius: 20
          }}  
        />

        {/* New Chat Button */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mt: 2,
          mb: 1,
          ml: 4
        }}>
          <IconButton
            variant={disableNewButton ? undefined : 'solid'}
            color="primary"
            disabled={disableNewButton}
            onClick={handleButtonNew}
            sx={{
              borderRadius: '50%',
              width: '2.5rem',
              height: '2.5rem',
            }}
          >
            <AddIcon />
          </IconButton>
          <Typography 
            level="body-md" 
            sx={{ 
              ml: 1.5,
              fontWeight: 500
            }}
          >
            New chat
          </Typography>
        </Box>

      </Box>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        mt: 2,
        mb: 1,
        gap: 2,
        ml: 4,
        mr: 4
      }}>
        <Typography 
          color='primary' 
          fontWeight={500} 
          level='body-md'
          sx={{
            borderBottom: '1px solid',
            borderColor: 'primary.main',
            pb: 0.5,
            display: 'inline-block'
          }}
        >
          Chats
        </Typography>
      </Box>

      {/* Chat Titles List (shrink as half the rate as the Folders List) */}
      <Box sx={{ flexGrow: 1, flexShrink: 1, flexBasis: '20rem', overflowY: 'auto', ...themeScalingMap[contentScaling].chatDrawerItemSx }}>
        {renderNavItems.map((item, idx) => item.type === 'nav-item-chat-data' ? (
            <ChatDrawerItemMemo
              key={'nav-chat-' + item.conversationId}
              item={item}
              showSymbols={!showPersonaIcons ? false : zenMode ? false : gifMode ? 'gif' : true}
              bottomBarBasis={filteredChatsBarBasis}
              onConversationActivate={handleConversationActivate}
              onConversationBranch={onConversationBranch}
              onConversationDeleteNoConfirmation={handleConversationDeleteNoConfirmation}
              onConversationExport={onConversationsExportDialog}
              onConversationFolderChange={handleConversationFolderChange}
            />
          ) : item.type === 'nav-item-group' ? (
            // <Typography 
            //   color='primary'
            //   key={'nav-divider-' + idx} level='body-sm' sx={{
            //   textAlign: 'left',
            //   my: 0,
            //   mx: 4,
            //   // my: 'calc(var(--ListItem-minHeight) / 4)',
            //   // keeps the group header sticky to the top
            //   position: 'sticky',
            //   top: 0,
            //   backgroundColor: OPTIMA_DRAWER_BACKGROUND,
            //   fontWeight: 500,
            //   zIndex: 1,
            //   textDecoration: 'underline',
            // }}>
            //   {item.title}
            // </Typography>
            <> </>
          ) : item.type === 'nav-item-info-message' ? (
            <Box key={'nav-info-' + idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, ml: 2 }}>
              <Typography level='body-xs' sx={{ color: 'primary.softColor', my: 'calc(var(--ListItem-minHeight) / 4)' }}>
                {filterHasStars && <StarOutlineRoundedIcon sx={{ color: 'primary.softColor', fontSize: 'xl', mb: -0.5, mr: 1 }} />}
                {item.message}
              </Typography>
              {(filterHasStars || filterHasImageAssets || filterHasDocFragments) && (
                <Tooltip title='Clear Filters'>
                  <IconButton size='sm' color='primary' onClick={clearFilters}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ) : null,
        )}
      </Box>

      <ListDivider sx={{ my: 0 }} />

      {/* Admin Panel - Only visible to admin users */}
      {isAdmin && (
        <>
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <ListItemButton onClick={props.onConversationsImportDialog} sx={{ flex: 1 }}>
              <ListItemDecorator>
                <FileDownloadOutlinedIcon />
              </ListItemDecorator>
              Import
            </ListItemButton>

            <ListItemButton disabled={filteredChatsAreEmpty} onClick={handleConversationsExport} sx={{ flex: 1 }}>
              <ListItemDecorator>
                <FileUploadOutlinedIcon />
              </ListItemDecorator>
              Export
            </ListItemButton>
          </Box>

          {/* App Preferences and Configure AI Model buttons */}
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <ListItemButton onClick={() => optimaOpenPreferences()} sx={{ flex: 1 }}>
              <ListItemDecorator>
                <SettingsIcon />
              </ListItemDecorator>
              App Preferences
            </ListItemButton>

            <ListItemButton onClick={() => optimaOpenModels()} sx={{ flex: 1 }}>
              <ListItemDecorator>
                <BuildCircleIcon />
              </ListItemDecorator>
              AI Models
            </ListItemButton>
          </Box>

          <ListItemButton disabled={filteredChatsAreEmpty} onClick={handleConversationsDeleteFiltered}>
            <ListItemDecorator>
              <DeleteOutlineIcon />
            </ListItemDecorator>
            Delete {filteredChatsCount >= 2 ? `all ${filteredChatsCount} chats` : 'chat'}
          </ListItemButton>

          <ListDivider sx={{ my: 1 }} />
        </>
      )}

      {/* User info and logout */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        px: 2, 
        py: 1,
        mb: 1
      }}>
        <UserInfoAndLogout />
      </Box>

    </OptimaDrawerList>


    {/* [Menu] Chat Item Folder Change */}
    {!!folderChangeRequest?.anchorEl && (
      <CloseablePopup
        menu anchorEl={folderChangeRequest.anchorEl} onClose={handleConversationFolderCancel}
        bigIcons
        minWidth={200}
        placement='bottom-start'
        zIndex={themeZIndexOverMobileDrawer /* need to be on top of the Modal on Mobile */}
        sx={{ minWidth: 200 }}
      >

        {/* Folder Assignment Buttons */}
        {allFolders.map(folder => {
          const isRequestFolder = folder === folderChangeRequest.currentFolder;
          return (
            <ListItem
              key={folder.id}
              variant={isRequestFolder ? 'soft' : 'plain'}
              onClick={() => handleConversationFolderSet(folderChangeRequest.conversationId, folder.id)}
            >
              <ListItemButton>
                <ListItemDecorator>
                  <FolderIcon sx={{ color: folder.color }} />
                </ListItemDecorator>
                {folder.title}
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Remove Folder Assignment */}
        {!!folderChangeRequest.currentFolder && (
          <ListItem onClick={() => handleConversationFolderSet(folderChangeRequest.conversationId, null)}>
            <ListItemButton>
              <ListItemDecorator>
                <ClearIcon />
              </ListItemDecorator>
              {ClearFolderText}
            </ListItemButton>
          </ListItem>
        )}

      </CloseablePopup>
    )}

  </>;
}
