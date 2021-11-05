import Editor from '../../rete/Editor';
import React, {useContext} from 'react';
import useListener from '../../../hooks/useListener';
import EventsContext, {
    PROJECT_CLEAR_EVENT,
    PROJECT_EXPORT_EVENT,
    PROJECT_LOAD_EVENT,
} from '../../../contexts/EventsContext';
import FileSaver from 'file-saver';
import {pascalCase} from 'change-case';
import useRedraw from '../../../hooks/useRedraw';
import isEmbedded from '../../../utils/isEmbedded';
import {useParams} from 'react-router-dom';
// import {BlocksEditor} from 'react-blocks-editor';

const STORAGE_EDITOR_STATE = 'blocks.editorState';

const DEFAULT_STATE = require('../../../examples/files/DefaultProject.json');

const embedded = isEmbedded();
const storage = embedded ? {} : localStorage; // Use temporary storage for iframe

if(embedded) {
    console.log('Using embedded mode.');
}

let nextEditorState;

export default function EditorPage() {
    const redraw = useRedraw();

    const {menu: menuParam} = useParams();

    const events = useContext(EventsContext);

    useListener(events, PROJECT_CLEAR_EVENT, () => {
        // TODO: confirmation modal
        // delete storage[STORAGE_EDITOR_STATE];
        nextEditorState = DEFAULT_STATE;
        redraw();
    });

    useListener(events, PROJECT_LOAD_EVENT, state => {
        // storage[STORAGE_EDITOR_STATE] = JSON.stringify(state);
        nextEditorState = state;///
        redraw();
    });

    useListener(events, PROJECT_EXPORT_EVENT, state => {
        let data = JSON.stringify(state);
        FileSaver.saveAs(new Blob([data]), `${pascalCase(state.name || 'project')}.blocks.json`);
    });

    const onEditorSetup = async (loadState, editor) => {
        let stateString = nextEditorState ? JSON.stringify(nextEditorState) : storage[STORAGE_EDITOR_STATE];
        nextEditorState = null;

        let state;
        if(stateString) {
            state = JSON.parse(stateString);
        }
        else {
            state = DEFAULT_STATE;
        }

        if(!await loadState(state)) {
            console.warn('Load error');
        }
    };

    const onEditorChange = (editor) => {
    };

    const onEditorSave = (state, editor) => {
        let stateString = JSON.stringify(state);
        storage[STORAGE_EDITOR_STATE] = stateString;
        if(embedded) {
            let message = {
                type: 'save',
                state: stateString,
            };
            console.log('Sending message:', message);
            let targetOrigin = '*'; // TODO: restrict
            window.parent.postMessage(message, targetOrigin);
        }
    };

    // Remote (iframe) message listener
    useListener(window, 'message', ({source, data}) => {
        if(typeof data === 'string') {
            console.log('Received message:', data);
            data = JSON.parse(data);
            if(data?.type === 'load') {
                nextEditorState = data.state ? JSON.parse(JSON.stringify(data.state)) : DEFAULT_STATE;
            }
        }
    });

    return (
        <Editor
            hideMenu={menuParam === 'hidden'}
            onSetup={onEditorSetup}
            onChange={onEditorChange}
            onSave={onEditorSave}
        />
        // <BlocksEditor style={{width: '100%', height: '100%'}} options={{menu: 'default'}}>
        //     {({loadState}) => {
        //         let state = require('../../../examples/files/Calculator.blocks.json');
        //         state.name = 'TEST';
        //         loadState(state);
        //     }}
        // </BlocksEditor>
    );
}