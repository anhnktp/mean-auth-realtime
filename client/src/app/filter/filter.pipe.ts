import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(userslist: any, term: any): any {
    //check if search item is undefined
    if (term === undefined) return userslist;
    //return updated userslist array
    return userslist.filter(function(profile){
      return profile.name.toLowerCase().includes(term.toLowerCase());
    })
  }

}
