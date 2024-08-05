import { Skeleton } from 'antd';

function LoadingSkeleton({ image = true, rows = 3, avatar = false, times = 8, title = false }): JSX.Element {
  return (
      <>
          {
              Array.from({ length: times }).map((_, index) => (
                  <div key={index} className='flex flex-row items-center gap-4 mb-4'>
                      {image && <Skeleton.Image active />}
                      <Skeleton paragraph={{ rows }} active loading title={title} />
                  </div>
              ))
          }
      </>
  );
}

export default LoadingSkeleton;
