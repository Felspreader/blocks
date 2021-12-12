import React, {useContext} from 'react';
import EventsContext, {ERROR_EVENT, PROJECT_LOAD_EVENT} from '../../contexts/EventsContext';
import classNames from 'classnames';
import styled from 'styled-components';
import EditorMenu from './EditorMenu';
import FileDropZone from '../common/FileDropZone';
import OutputPanel from './OutputPanel';
import EditorWrapper from './EditorWrapper';
import useObservableState from '../../hooks/utils/useObservableState';

export const DROP_ZONE_EXTENSIONS = ['.blocks', '.blocks.json'];

const EditorContainer = styled.div`
    width: 100%;
    height: 100vh;
`;

function EditorControls({observable, hideMenu, loadFileContent}) {
    const [editor] = useObservableState(observable);

    if(!editor) {
        return null;
    }
    return (
        <>
            {!hideMenu && (
                <EditorMenu editor={editor} onLoadFileContent={loadFileContent}/>
            )}
            <OutputPanel editor={editor}/>
        </>
    );
}

export default function Editor({observable, hideMenu, onSetup, onChange, onSave, className, ...others}) {

    const events = useContext(EventsContext);

    const loadFileContent = content => {
        try {
            const project = JSON.parse(content);
            events.emit(PROJECT_LOAD_EVENT, project);
        }
        catch(err) {
            events.emit(ERROR_EVENT, err);
        }
    };

    return (
        <FileDropZone options={{noClick: true, accept: DROP_ZONE_EXTENSIONS.join(',')}} onFileContent={loadFileContent}>
            <EditorContainer
                className={classNames('node-editor d-flex flex-grow-1 flex-column', className)}
                {...others}>
                <EditorControls observable={observable} hideMenu={hideMenu} loadFileContent={loadFileContent}/>
                <EditorWrapper
                    observable={observable}
                    onSetup={onSetup}
                    onChange={onChange}
                    onSave={onSave}
                />
            </EditorContainer>
        </FileDropZone>
    );
}
