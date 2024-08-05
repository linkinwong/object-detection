

// 节流更新
export const updateAnnotationMsg = (ws: any, id: string, frames: number, cb: any) => {
    const { instance, msg } = ws;
    const currentJobMsg = msg[id];
    if (!currentJobMsg) return;
    const { list: currentJobMsgList, isCurrentJobPath } = currentJobMsg;
    if (!isCurrentJobPath) return;

    if (currentJobMsgList?.length) {
        const shift = currentJobMsgList.splice(0, frames || currentJobMsgList.length);
        console.log('currentJobMsgList-------shift', shift);
        if (shift?.length) {
            cb(shift);
        }
    }
}
