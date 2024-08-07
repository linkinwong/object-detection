import { useEffect, useRef, useState } from 'react';
import { getCore, Job, Task } from 'cvat-core-wrapper';
import notification from 'antd/lib/notification';
import { useParams } from 'react-router';


export default function useUpdateTask(){
    const core = getCore();
    const id = +useParams<{ id: string }>().id;
    const mounted = useRef(false);

    const [taskInstance, setTaskInstance] = useState<Task | null>(null);
    const [error,setError] = useState(null)
    const [loading,setLoading] = useState(false)
    const [updating,setUpdating] = useState(false)

    useEffect(() => {
        mounted.current = true;
        receiveTask(id);
        return () => {
            mounted.current = false;
        };
    }, [id]);

    const receiveTask = (id: number): void => {
        setLoading(!0);
        core.tasks.get({ id })
            .then(([task]: Task[]) => {
                if (task) {
                    setTaskInstance(task);
                }
            }).catch((error: Error) => {
            if (mounted.current) {
                notification.error({
                    message: 'Could not receive the requested task from the server',
                    description: error.toString(),
                });
            }
        }).finally(() => {
            if (mounted.current) {
                setLoading(false);
            }
        });
    }

    const onJobUpdate = (job: Job): void => {
        setUpdating(!0);
        job.save().then(() => {
            if (mounted.current) {
                receiveTask(id);
            }
        }).catch((error: Error) => {
            notification.error({
                message: 'Could not update the job',
                description: error.toString(),
            });
        }).finally(() => {
            if (mounted.current) {
                setUpdating(false);
            }
        });
    };


    return { mounted, onJobUpdate, taskInstance, setTaskInstance, error, loading, updating }

}
