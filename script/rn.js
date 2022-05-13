function removeEle(arr,v){
    for (let i = 0; i < arr.length; i++) {
        if(arr[i]==v){
            arr.splice(i,1)
            return arr
        }
    }
}

class RNet{
    constructor(){this.init()}
    init(){
        this.stg_save=true

        this.name=null
        this.ver=''
        this.midx=-1
        this.styles={}
        this.points={}
        this.links={}
        this.groups={}
        this.shapes={}
        this.graphs={}
    }
    loadRNet(rn){
        this.init()
        this.name=rn.name
        this.ver=rn.ver
        this.midx=rn.midx
        this.cmd=rn.cmd

        var stlobj=Object.values(rn.styles)
        for (let i = 0; i < stlobj.length; i++) {
            this.styles[stlobj[i].sid]=new Style(stlobj[i])
        }
        var pntobj=Object.values(rn.points)
        for (let i = 0; i < pntobj.length; i++) {
            this.points[pntobj[i].nid]=new Point(pntobj[i])
        }
        var lnkobj=Object.values(rn.links)
        for (let i = 0; i < lnkobj.length; i++) {
            this.links[lnkobj[i].lid]=new Link(lnkobj[i])
        }
        var gphobj=Object.values(rn.graphs)
        for (let i = 0; i < gphobj.length; i++) {
            this.graphs[gphobj[i].nid]=new Graph(gphobj[i])
        }
    }
    downRNet(){
        var file_saver = require('file-saver')
        var blob = new Blob([JSON.stringify(this)], {type: "text/plain;charset=utf-8"})
        file_saver.saveAs(blob, this.name+".json")
    }
    getEle(id,type='point'){
        switch (type) {
            case 'point':return this.points[id]
            case 'graph':return this.graphs[id]
            case 'link':return this.links[id]
            default:break;
        }
    }
    getGraphEle(gid=null,item='id'){
        let gph=this.getGraph(gid)
        switch (item) {
            case 'id':
                return Object.keys(gph.overlay)
            case 'obj':
                return Object.values(gph.overlay)
            default:return null
        }
    }
    getOverlay(id,gid=null){
        if(gid==null) gid=this.gid_actv
        let gph=this.graphs[gid]
        return gph.overlay[id]
    }
    setOverlay(id,value,gid=null){
        if(gid==null) gid=this.gid_actv
        this.graphs[gid].overlay[id]=value
    }
    /**
     * 获取款式。
     * @param ido 可以是对象或id。
     * @return stl: RNet.Style 返回对象的款式。
     */
    getStyle(ido,type='point') {
        if(ido instanceof Link) ido=ido.lid
        else if(ido instanceof MetaNode)ido=ido.nid
        switch(type){
            case 'point':return this.styles[this.points[ido].style]
            case 'graph':return this.styles[this.graphs[ido].style]
            case 'link':return this.styles[this.links[ido].style]
        }
    }
    setEle(id,k,v){
        this.stg_save=false
        if(this.points.hasOwnProperty(id)) this.points[id][k]=v
        else if(this.graphs.hasOwnProperty(id)) this.graphs[id][k]=v
        else if(this.links.hasOwnProperty(id)) this.links[id][k]=v
        'todo'
    }
    addEle(obj,type='point'){
        switch (type) {
            case 'point':
                this.midx+=1
                obj.nid=this.midx
                let point=new Point(obj)
                this.points[this.midx]=point
                return point
            case 'link':
                this.midx+=1
                obj.lid=this.midx
                let link=new Link(obj)
                this.links[this.midx]=link
                this.graphs[this.gid_actv].overlay[link.lid]={geo:[0.0,0,0]}
        return link
            default:break;
        }
    }
    /**
     * 删除指定要素。
     * @param {*} id
     * @param {*} type 'point'/'link'
     * @returns 返回删除的要素列表。
     */
    delEle(id,type='point'){
        if (!this.hasEle(id,type)) return null
        switch (type) {
            case 'point':
                let ltd=[]
                let ret=[]
                let pairs=Object.entries(this.links)
                for (let i = 0; i < pairs.length; i++) {
                    let arr=[...pairs[i][1].start,...pairs[i][1].end]
                    for (let j = 0; j < arr.length; j++) {
                        if (arr[j][0]==id){
                            ltd.push(pairs[i][0])
                            break
                        }
                    }
                }
                for (let i = 0; i < ltd.length; i++) {
                    delete this.graphs[this.gid_actv].overlay[ltd[i]]
                    ret.push(this.links[ltd[i]])
                    delete this.links[ltd[i]]
                }
                let point=this.points[id]
                delete this.graphs[this.gid_actv].overlay[id]
                delete this.points[id]
                ret.push(point)
                return ret
            case 'link':
                delete this.graphs[this.gid_actv].overlay[id]
                let link=this.links[id]
                delete this.links[id]
                return [link]
            default:
                break;
        }
    }
    linkEle(sid,eid){
        if(this.points.hasOwnProperty(sid)&&this.points.hasOwnProperty(eid)){
            var link=this.addEle({},'link')
            link.start.push([sid,-1])
            link.end.push([eid,-1])
        }else if(this.points.hasOwnProperty(sid)){
            var link=this.links[eid]
            link.start.push([sid,-1])
        }else if(this.points.hasOwnProperty(eid)){
            var link=this.links[sid]
            link.end.push([eid,-1])

        }

        return link
    }
    hasEle(id,type='point'){
        switch (type) {
            case 'point':
                return this.points.hasOwnProperty(id)
            case 'link':
                return this.links.hasOwnProperty(id)
            default:break;
        }
    }
    addEleToGraph(id,overlay,gid=null){
        this.stg_save=false
        if (gid==null) gid=this.gid_actv
        this.graphs[gid].overlay[id]=overlay
    }
    /**
     * 激活指定绘图。
     * @param gid gid不指定时激活第一个绘图。
     * @return gph: RNet.Graph 返回激活的绘图。
     */
    acvtiveGraph(gid=null){
        if(gid==null) gid=Object.keys(this.graphs)[0]
        this.gid_actv=gid
        return this.graphs[gid]
    }
    /**
     * 获取指定绘图。
     * @param gid gid不指定时返回激活的绘图。
     * @return gph: RNet.Graph 返回指定的绘图。
     */
    getGraph(gid=null){
        if(gid==null) gid=this.gid_actv
        return this.graphs[gid]
    }

    getAroundLink(nid,gid=null){
        if(gid==null) gid=this.gid_actv
        let nids=Object.keys(this.graphs[gid].overlay)
        let opt_s=[]
        let opt_e=[]
        for (let i = 0; i < nids.length; i++) {
            if(this.points.hasOwnProperty(parseInt(nids[i]))) continue
            let link=this.links[nids[i]]
            for (let j = 0; j < link.start.length; j++) {
                if(link.start[j][0]==nid){
                    opt_s.push(link.lid)
                }
            }
            for (let j = 0; j < link.end.length; j++) {
                if(link.end[j][0]==nid){
                    opt_e.push(link.lid)
                }
            }
        }
        return [opt_s,opt_e]
    }
    getNodeInGraph(type='point',gid=null){
        if(gid==null) gid=this.gid_actv
        let ids=Object.keys(this.graphs[gid].overlay)
        let opt=[]
        if(type=='point') var d=this.points
        else if(type=='link') var d=this.links
        for (let i = 0; i < ids.length; i++) {
            if(d.hasOwnProperty(ids[i])){
                opt.push(ids[i])
            }
        }
        return opt
    }
    arrangeCenter(gid=null){
        let gph=this.getGraph(gid)
        let lids=this.getNodeInGraph('link',gid)
        let p_links={}
        for (let i = 0; i < lids.length; i++) {
            let arr=[...this.links[lids[i]].start,...this.links[lids[i]].end]
            for (let j = 0; j < arr.length; j++) {
                let pid=arr[j][0]
                if(!p_links.hasOwnProperty(pid)){p_links[pid]=[lids[i]]}
                else p_links[pid].push(lids[i])
            }
        }
        let track=[]
        let ptr=0
        let dealed=[]
        let pairs=Object.entries(p_links)
        let undeal=Object.keys(p_links)
        while(dealed.length!=pairs.length){     // 全图级
            let argmax=0
            let max=0
            for (let i = 0; i < undeal.length; i++) {
                if(p_links[undeal[i]].length>=max){
                    argmax=undeal[i]
                    max=p_links[undeal[i]].length
                }
            }
            let layer=0
            let l_next=0  // length next Layer.
            let l_prev=1    // length prevoius layer.
            track.push({pid:argmax,l:layer,m:1,n:1,p:null,ad:2*PI,as:0,cn:0})
            dealed.push(String(argmax))
            undeal.splice(undeal.indexOf(argmax),1)
            while (l_prev!=0){    // 连通图级
                l_next=0
                while (l_prev!=0) {
                    let mi=1
                    let lids=p_links[track[ptr].pid]
                    for (let i = 0; i < lids.length; i++) {
                        let skip=true
                        let arr=[...this.links[lids[i]].start,...this.links[lids[i]].end]
                        let dn=0
                        for (let j = 0; j < arr.length; j++) {
                            let pidj=String(arr[j][0])
                            if(dealed.indexOf(pidj)==-1){
                                skip=false
                                dn+=1
                                dealed.push(pidj)
                                l_next+=1
                                undeal.splice(undeal.indexOf(pidj),1)
                                track.push({
                                    pid:pidj,
                                    l:layer+1,
                                    m:mi,
                                    n:dn,
                                    p:ptr,ad:2*PI})
                            }
                        }
                        if(!skip) mi+=1
                    }
                    ptr+=1
                    l_prev-=1
                }
                l_prev=Number(l_next)
                layer+=1
            }
        }
        let nx=1,mx=1
        for (let i = 0; i < track.length; i++) {
            if(i>0){
                let c1=track[i].l!=track[i-1].l
                if (c1){
                    let j=1
                    mx=1
                    if(i!=track.length-1){
                        while(track[i].l==track[i+j].l){
                            mx=Math.max(mx,track[i+j].m)
                            j+=1
                        }
                    }
                }
                let c2=track[i].m!=track[i-1].m
                if(c1^c2){
                    let j=1
                    nx=1
                    if(i!=track.length-1){
                        while((track[i].m==track[i+j].m)&&track[i].l==track[i+j].l){
                            nx=Math.max(nx,track[i+j].n)
                            j+=1
                        }
                    }
                }
            }

            if(track[i].p!=null) track[i].ad=track[track[i].p].ad/mx/nx
            if (track[i].p!=null){
                track[i].as=track[track[i].p].as+(track[i].n-1)*track[i].ad+(track[i].m-1)*track[track[i].p].ad/mx
            }
        }
        let lt=0,cn=0,lts=[]
        for (let i = 0; i < track.length-1; i++) {
            if(i!=track.length-2){
                if(track[i+1].l<track[i].l){
                    lt+=track[i].l
                    cn+=1
                    if(lts.length>0) lts.push(2*lts[lts.length-1]+track[i].l)
                    else lts.push(track[i].l)
                }
            }else{
                lt+=track[i+1].l
                if(lts.length>0){
                    lts.push(2*lts[lts.length-1]+track[i+1].l)
                }
                else lts.push(track[i+1].l)
            }
            track[i+1].cn=cn
        }
        let lrx=gph.geo[3]/lt/2
        for (let i = 0; i < track.length; i++) {
            let r=lrx*track[i].l
            let a=track[i].ad/2+track[i].as
            let x=r*cos(a)+lts[track[i].cn]*lrx
            let y=r*sin(a)+gph.geo[4]/2
            let geo=gph.overlay[track[i].pid].geo
            gph.overlay[track[i].pid].geo=[geo[0],x,y,geo[3],geo[4]]
        }
    }
}

class Style{
    constructor(obj=null){
        this.sid=-1
        this.name='node'
        this.suitable='point'
        this.font='思源黑体'
        this.font_size=15
        this.font_color='#ffffff'
        this.node_shape='自由圆'
        this.back_color='#000000'
        this.tmn_size=10
        this.tmn_shape=['无','箭头']
        this.line_type=10
        this.line_wgt=2
        this.line_wgt=10
        if(obj!=null){
            let pair=Object.entries(obj)
            for (let i=0;i<pair.length;i++){
                this[pair[i][0]]=pair[i][1]
            }
        }
    }
}
class Link{
    constructor(obj=null){
        this.lid=-1
        this.desc=''
        this.style=0
        this.start=[]   // [[nid, pid]...]
        this.end=[]
        this.step=[]
        this.geo=[.0,0,0]
        if(obj!=null){
            let pair=Object.entries(obj)
            for (let i=0;i<pair.length;i++){
                this[pair[i][0]]=pair[i][1]
            }
        }
    }
}
class Port{
    constructor(){
        this.pid=-1
        this.drt=0  // 0：双向，1：输入，-1：输出。
        this.pos=[0,0]
    }
}
class MetaNode{
    constructor(obj=null){
        this.nid=-1
        this.name='node'
        this.type='point'    // point：节点，graph：绘图，group：群组，shape：形状。
        this.desc=''
        this.style=0
        this.shape="自由圆"
        this.ports={}
        this.geo=[0.0,0,0,50,50]
        this._extendObj(obj)

    }
    _extendObj(obj){
        if(obj==null) return
        var pair=Object.entries(obj)
        for (let i=0;i<pair.length;i++){
            this[pair[i][0]]=pair[i][1]
        }
    }
}
class Point extends MetaNode{
    constructor(obj=null){
        super(obj)
        this.image=''
        this._extendObj(obj)
    }
}
class Group extends MetaNode{
    constructor(obj=null){
        super(obj)
        this._extendObj(obj)
    }
}
class Graph extends MetaNode{
    constructor(obj=null){
        super(obj)
        this.overlay={}

        this._extendObj(obj)
    }
}

var RN=new RNet()
