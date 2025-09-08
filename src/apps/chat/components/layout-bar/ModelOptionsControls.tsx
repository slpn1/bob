import * as React from 'react';

import {Box, Menu, MenuButton, MenuItem, ListItemDecorator, Dropdown} from '@mui/joy';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

import {GoodTooltip} from '~/common/components/GoodTooltip';

type WebSearchLevel = 'off' | 'low' | 'medium' | 'comprehensive';
type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high';

const WEB_SEARCH_OPTIONS: Array<{ value: WebSearchLevel; label: string }> = [
    {value: 'off', label: 'Off'},
    {value: 'low', label: 'Low'},
    {value: 'medium', label: 'Medium'},
    {value: 'comprehensive', label: 'Comprehensive'}
];

const REASONING_OPTIONS: Array<{ value: ReasoningLevel; label: string }> = [
    {value: 'minimal', label: 'Minimal'},
    {value: 'low', label: 'Low'},
    {value: 'medium', label: 'Medium'},
    {value: 'high', label: 'High'}
];

const DEEP_RESEARCH_OPTIONS: Array<{ value: boolean; label: string }> = [
    {value: false, label: 'Off'},
    {value: true, label: 'On'}
];

interface WebSearchControlProps {
    value: WebSearchLevel;
    onChange: (value: WebSearchLevel) => void;
    disabled?: boolean;
}

function WebSearchControl({value, onChange, disabled}: WebSearchControlProps) {
    const displayLabel = WEB_SEARCH_OPTIONS.find(opt => opt.value === value)?.label || 'Off';

    return (
        <GoodTooltip title="Web Search Level">
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <LanguageRoundedIcon sx={{fontSize: 'sm', color: disabled ? 'text.tertiary' : 'text.secondary'}}/>
                <Box sx={{fontSize: 'sm', fontWeight: 500, color: disabled ? 'text.tertiary' : 'text.primary'}}>
                    Web Search:
                </Box>
                <Dropdown>
                    <MenuButton
                        disabled={disabled}
                        size="sm"
                        variant="plain"
                        color={disabled ? 'neutral' : 'primary'}
                        sx={{
                            width: '3rem',
                            fontSize: 'sm',
                            fontWeight: 500,
                            color: disabled ? 'text.tertiary' : 'white',
                            '&:hover': disabled ? {} : {
                                backgroundColor: 'primary.softHoverBg',
                            },
                        }}
                    >
                        {displayLabel}
                    </MenuButton>

                    <Menu placement="bottom-end" size="sm">
                        {WEB_SEARCH_OPTIONS.map((option) => (
                            <MenuItem
                                key={option.value}
                                selected={value === option.value}
                                onClick={() => onChange(option.value)}
                                sx={{
                                    color: 'primary',
                                    '&:hover': disabled ? {} : {
                                        backgroundColor: 'primary.softHoverBg',
                                        color: 'white',
                                    },
                                    '&.Mui-selected': {
                                        color: 'white',
                                        backgroundColor: 'primary.solidBg',
                                    },
                                    '&:active': {
                                        backgroundColor: 'white'
                                    },
                                }}
                            >
                                {/*<ListItemDecorator>*/}
                                {/*    {value === option.value && <CheckRoundedIcon/>}*/}
                                {/*</ListItemDecorator>*/}
                                {option.label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Dropdown>
            </Box>
        </GoodTooltip>
    );
}

interface ReasoningControlProps {
    value: ReasoningLevel;
    onChange: (value: ReasoningLevel) => void;
    disabled?: boolean;
}

function ReasoningControl({value, onChange, disabled}: ReasoningControlProps) {
    const displayLabel = REASONING_OPTIONS.find(opt => opt.value === value)?.label || 'Medium';

    return (
        <GoodTooltip title="Reasoning Level">
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <PsychologyIcon sx={{fontSize: 'sm', color: disabled ? 'text.tertiary' : 'text.secondary'}}/>
                <Box sx={{fontSize: 'sm', fontWeight: 500, color: disabled ? 'text.tertiary' : 'text.primary'}}>
                    Reasoning:
                </Box>
                <Dropdown>
                    <MenuButton
                        disabled={disabled}
                        size="sm"
                        variant="plain"
                        color={disabled ? 'neutral' : 'primary'}
                        sx={{
                            width: '6rem',
                            fontSize: 'sm',
                            fontWeight: 500,
                            color: disabled ? 'text.tertiary' : 'white',
                            '&:hover': disabled ? {} : {
                                backgroundColor: 'primary.softHoverBg',
                            },
                        }}
                    >
                        {displayLabel}
                    </MenuButton>

                    <Menu placement="bottom-end" size="sm">
                        {REASONING_OPTIONS.map((option) => (
                            <MenuItem
                                key={option.value}
                                selected={value === option.value}
                                onClick={() => onChange(option.value)}
                            >
                                <ListItemDecorator>
                                    {value === option.value && <CheckRoundedIcon/>}
                                </ListItemDecorator>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Dropdown>
            </Box>
        </GoodTooltip>
    );
}

interface DeepResearchControlProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

function DeepResearchControl({enabled, onChange, disabled}: DeepResearchControlProps) {
    const displayLabel = enabled ? 'On' : 'Off';

    return (
        <GoodTooltip title="Deep Research Mode">
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <AccountTreeOutlinedIcon sx={{fontSize: 'sm', color: disabled ? 'text.tertiary' : 'text.secondary'}}/>
                <Box sx={{fontSize: 'sm', fontWeight: 500, color: disabled ? 'text.tertiary' : 'text.primary'}}>
                    Deep Research:
                </Box>
                <Dropdown>
                    <MenuButton
                        disabled={disabled}
                        size="sm"
                        variant="plain"
                        color={disabled ? 'neutral' : 'primary'}
                        sx={{
                            width: '3rem',
                            fontSize: 'sm',
                            fontWeight: 500,
                            color: disabled ? 'text.tertiary' : 'white',
                            '&:hover': disabled ? {} : {
                                backgroundColor: 'primary.softHoverBg',
                            },
                        }}
                    >
                        {displayLabel}
                    </MenuButton>

                    <Menu placement="bottom-end" size="sm">
                        {DEEP_RESEARCH_OPTIONS.map((option) => (
                            <MenuItem
                                key={option.value.toString()}
                                selected={enabled === option.value}
                                onClick={() => onChange(option.value)}
                            >
                                <ListItemDecorator>
                                    {enabled === option.value && <CheckRoundedIcon/>}
                                </ListItemDecorator>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Dropdown>
            </Box>
        </GoodTooltip>
    );
}

export interface ModelOptionsControlsProps {
    webSearch: WebSearchLevel;
    reasoning: ReasoningLevel;
    deepResearch: boolean;
    disabled?: boolean;
    onWebSearchChange: (value: WebSearchLevel) => void;
    onReasoningChange: (value: ReasoningLevel) => void;
    onDeepResearchChange: (enabled: boolean) => void;
}

export function ModelOptionsControls({
                                         webSearch,
                                         reasoning,
                                         deepResearch,
                                         disabled = false,
                                         onWebSearchChange,
                                         onReasoningChange,
                                         onDeepResearchChange,
                                     }: ModelOptionsControlsProps) {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 3}}>
            <WebSearchControl
                value={webSearch}
                onChange={onWebSearchChange}
                disabled={disabled}
            />

            <ReasoningControl
                value={reasoning}
                onChange={onReasoningChange}
                disabled={disabled}
            />

            <DeepResearchControl
                enabled={deepResearch}
                onChange={onDeepResearchChange}
                disabled={disabled}
            />
        </Box>
    );
}
