import {Encoder, Project, Frame, FileWriteInfo, Label, LabelClass, DEFAULT_LABEL_TYPES, ProjectManager, ContourProps} from '@infolks/labelmore-devkit'
import {ImageInfo} from '../types'

export class PixelwiseEncoder extends Encoder {
    
    public readonly title = "ADAS Pixelwise"
    public readonly icon = `<i class="fas fa-th"></i>`
    public readonly name = 'encoders.adas.pixelwise'

    constructor(protected pm: ProjectManager) {
        super()
    }
    
    encode(frame: Frame, project: Project): FileWriteInfo[] {
        
        const frame_num = project.frames.findIndex(f => f.name === frame.name)

        // object labels
        const object_json = JSON.stringify(this.encodeObjectLabels(frame, project, frame_num), undefined, 4)

        // scene labels
        const scene_json = JSON.stringify(this.encodeSceneLabels(frame, project, frame_num), undefined, 4)

        const frame_name = frame.name.split('.').slice(0, -1)

        return [
            {
                name: `${project.title}_Pixelwise_${frame_name}_object.json`,
                subdirectory: Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(object_json)
            },
            {
                name: `${project.title}_Pixelwise_${frame_name}_scene.json`,
                subdirectory: Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(scene_json)
            }
        ]
    }
    
    
    finalize(project: Project): FileWriteInfo[] {
        return []
    }


    private encodeSceneLabels(frame: Frame, project: Project, frame_num: number) {

        const FrameSceneLabels = {}

        for (let key in frame.props.scene) {

            const value = frame.props.scene[key]

            if (value) {
                FrameSceneLabels[key.trim()] = value
            }
        }

        return {
            FrameNumber: frame_num,
            TimeStamp: new Date().getTime(),
            FrameSceneLabels
        }
    }

    private encodeObjectLabels(frame: Frame, project: Project, frame_num: number) {

        const FrameObjectLabels = []

        const numLabels = frame.labels.length

        const channelMap = {
            'medium': 'CAMERAMedium',
            'high': 'CAMERAHigh',
            'low': 'CAMERALow'
        }

        const channel = channelMap[project.options.extras.channel]

        const frame_name = frame.name.split('.').slice(0, -1)

        frame.labels.forEach((label, index) => {

            if (label.type === DEFAULT_LABEL_TYPES.boundbox) {

                const class_ = project.options.labelClasses.find(cl => cl.id === label.class_id)

                const track_id = frame_num*numLabels + index

                FrameObjectLabels.push(this.encodeLabel(
                    label, 
                    class_, 
                    track_id, 
                    {
                        name: `${channel}_${frame_name}_${class_.name}_${track_id}.png`,
                        size: {
                            width: 0,
                            height: 0
                        }
                    }
                ))
            }
        })

        return {
            FrameNumber: frame_num,
            TimeStamp: new Date().getTime(),
            FrameObjectLabels
        }
    }

    private encodeLabel(label: Label<ContourProps>, class_: LabelClass, track_id: number, image: ImageInfo) {

        let attributes = {}

        console.log('attributes:',label.attributes)

        for (let key in label.attributes) {

            const value = label.attributes[key]

            if (value && value.length) {
                attributes[key.trim()] = value
            }
        }

        const points = label.props.points

        return {
            baseimage: "",
            roll: 0,
            pitch: 0,
            width: image.size.width,
            height: image.size.height,
            category: class_.name,
            Hierarchy: "",
            Trackid: track_id,
            attributes,
            imagetype: "",
            imagename: image.name,
            imagedata: "",
            imageheight: image.size.height,
            imagewidth: image.size.width,
            shape: {
                "Algo Generated": "NO",
                "Manually Corrected": "NO",
                type: "Pixel",
                thickness: 2,
                x: points.map(p => p.x),
                y: points.map(p => p.y),
                z: []
            },
            keypoints: {}
        }
    }
}

export default {
    install(Vue: any, opts: any) {

        Vue.mixin({
            beforeCreate() {

                if (this.$projects) {

                    const pixelEnc = new PixelwiseEncoder(this.$projects)

                    if (!this.$projects.hasEncoder(pixelEnc.name)) {

                        this.$projects.registerEncoder(pixelEnc.name, pixelEnc)
                    }
                }
            }
        })
    }
}