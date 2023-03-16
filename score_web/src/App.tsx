import routes from '@/routes'
import { renderRoutes, RouteConfig } from 'react-router-config';
function App() {
  return (
    <div style={{width: '100%', height:'100%'}}>
        {renderRoutes(routes as RouteConfig[])}
    </div>
  );
}

export default App;