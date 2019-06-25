import { Encoder, Project, Frame, FileWriteInfo, ProjectManager } from '@infolks/labelmore-devkit';
export declare class PolylineEncoder extends Encoder {
    protected pm: ProjectManager;
    readonly title = "ADAS Polyline";
    readonly icon = "<i class=\"fas fa-bezier-curve\"></i>";
    readonly name = "encoders.adas.polyline";
    constructor(pm: ProjectManager);
    encode(frame: Frame, project: Project): FileWriteInfo[];
    finalize(project: Project): FileWriteInfo[];
    private encodeSceneLabels;
    private encodeObjectLabels;
    private encodeLabel;
}
declare const _default: {
    install(Vue: any, opts: any): void;
};
export default _default;
