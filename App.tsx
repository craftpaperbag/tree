
import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowEditor from './components/FlowEditor';

const App: React.FC = () => {
  return (
    <div className="w-full h-full bg-slate-50">
      <ReactFlowProvider>
        <FlowEditor />
      </ReactFlowProvider>
    </div>
  );
};

export default App;
