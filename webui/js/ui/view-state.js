import { TabStatus } from '../domain/enums/tab-status.js';


export class ViewState
{
    constructor()
    {
        this.appViewModelDict = {};
        this.tab = TabStatus.ALLAPPS; 
        this.searchQuery = '';
        this.activeApp = null;
    }

    getActiveAppViewModel()
    {
        if (!this.activeApp) return null;
        return this.appViewModelDict[this.activeApp.id] || null;
    }
}
