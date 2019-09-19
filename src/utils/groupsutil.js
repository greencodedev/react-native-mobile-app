export const getGroupByUser =(recommendGroups ,userid)=> {


let recommendGroupsArray =  recommendGroups.filter((item)=>{
    let filterGroupArray = item._team.users.filter(subItem =>{
        
        return(subItem._id.toString() == userid.toString() )
    })
    
    return(filterGroupArray.length >0 )
})

return recommendGroupsArray;
}