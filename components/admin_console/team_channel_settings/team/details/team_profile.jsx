// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';
import {useDispatch} from 'react-redux';

import Tooltip from 'components/tooltip';

import {ModalIdentifiers} from 'utils/constants';
import {openModal} from 'actions/views/modals';
import PricingModal from 'components/pricing_modal';

import OverlayTrigger from 'components/overlay_trigger';
import useGetUsageDeltas from 'components/common/hooks/useGetUsageDeltas';
import {t} from 'utils/i18n';

import AdminPanel from 'components/widgets/admin_console/admin_panel';
import FormattedMarkdownMessage from 'components/formatted_markdown_message.jsx';
import ArchiveIcon from 'components/widgets/icons/archive_icon';
import UnarchiveIcon from 'components/widgets/icons/unarchive_icon';

import * as Utils from 'utils/utils';

import TeamIcon from 'components/widgets/team_icon/team_icon';

import './team_profile.scss';

export function TeamProfile({team, isArchived, isDisabled, onToggleArchive}) {
    const teamIconUrl = Utils.imageURLForTeam(team);
    const usageDeltas = useGetUsageDeltas();
    const dispatch = useDispatch();
    const [restoreDisabled, setRestoreDisabled] = useState(false);

    useEffect(() => {
        setRestoreDisabled(usageDeltas.teams.teamsLoaded && usageDeltas.teams.active >= 0 && isArchived);
    }, [usageDeltas, isArchived]);

    let archiveBtnID;
    let archiveBtnDefault;
    if (restoreDisabled) {
        archiveBtnID = t('admin.billing.subscription.upgrade');
        archiveBtnDefault = 'Upgrade';
    } else if (isArchived) {
        archiveBtnID = t('admin.team_settings.team_details.unarchiveTeam');
        archiveBtnDefault = 'Unarchive Team';
    } else {
        archiveBtnID = t('admin.team_settings.team_details.archiveTeam');
        archiveBtnDefault = 'Archive Team';
    }

    return (
        <AdminPanel
            id='team_profile'
            titleId={t('admin.team_settings.team_detail.profileTitle')}
            titleDefault='Team Profile'
            subtitleId={t('admin.team_settings.team_detail.profileDescription')}
            subtitleDefault='Summary of the team, including team name and description.'
        >

            <div className='group-teams-and-channels'>

                <div className='group-teams-and-channels--body'>
                    <div className='d-flex'>
                        <div className='large-team-image-col'>
                            <TeamIcon
                                content={team.display_name}
                                size='lg'
                                url={teamIconUrl}
                            />
                        </div>
                        <div className='team-desc-col'>
                            <div className='row row-bottom-padding'>
                                <FormattedMarkdownMessage
                                    id='admin.team_settings.team_detail.teamName'
                                    defaultMessage='**Team Name**:'
                                />
                                <br/>
                                {team.display_name}
                            </div>
                            <div className='row'>
                                <FormattedMarkdownMessage
                                    id='admin.team_settings.team_detail.teamDescription'
                                    defaultMessage='**Team Description**:'
                                />
                                <br/>
                                {team.description || <span className='greyed-out'>{Utils.localizeMessage('admin.team_settings.team_detail.profileNoDescription', 'No team description added.')}</span>}
                            </div>

                        </div>
                    </div>
                    <div className='AdminChannelDetails_archiveContainer'>
                        <OverlayTrigger
                            delay={400}
                            placement='right'
                            disabled={!restoreDisabled}
                            overlay={
                                <Tooltip id='sharedTooltip'>
                                    <FormattedMessage
                                        id={'workspace_limits.teams_limit_reached.tool_tip'}
                                        defaultMessage={'You\'ve reached the team limit for your current plan. Consider upgrading or deactivating other teams'}
                                    />
                                </Tooltip>
                            }
                        >
                            {/* See" https://github.com/react-bootstrap/react-bootstrap/issues/1588 - you can't use overlaytrigger with a disabled button.
                                workaround: https://github.com/react-bootstrap/react-bootstrap/issues/2428#issuecomment-407800236

                            */}
                            {restoreDisabled ? <div
                                onClick={() => {
                                    dispatch(openModal({
                                        modalId: ModalIdentifiers.PRICING_MODAL,
                                        dialogType: PricingModal,
                                    }));
                                }}
                                style={{display: 'inline-block', cursor: 'pointer'}}
                            >
                                <button
                                    type='button'
                                    disabled={restoreDisabled}
                                    style={{pointerEvents: 'none'}}
                                    className={
                                        classNames(
                                            'btn',
                                            'btn-secondary',
                                            'ArchiveButton',
                                            {ArchiveButton___archived: isArchived},
                                            {ArchiveButton___unarchived: !isArchived},
                                            {disabled: isDisabled},
                                            'cloud-limits-disabled',
                                        )
                                    }
                                    onClick={onToggleArchive}
                                >
                                    {isArchived ? (
                                        <UnarchiveIcon
                                            className='channel-icon channel-icon__unarchive'
                                        />
                                    ) : (
                                        <ArchiveIcon className='channel-icon channel-icon__archive'/>
                                    )}
                                    <FormattedMessage
                                        id={archiveBtnID}
                                        defaultMessage={archiveBtnDefault}
                                    />
                                </button>
                            </div> : <button
                                type='button'
                                disabled={restoreDisabled}
                                className={
                                    classNames(
                                        'btn',
                                        'btn-secondary',
                                        'ArchiveButton',
                                        {ArchiveButton___archived: isArchived},
                                        {ArchiveButton___unarchived: !isArchived},
                                        {disabled: isDisabled},
                                        'cloud-limits-disabled',
                                    )
                                }
                                onClick={onToggleArchive}
                            >
                                {isArchived ? (
                                    <UnarchiveIcon
                                        className='channel-icon channel-icon__unarchive'
                                    />
                                ) : (
                                    <ArchiveIcon className='channel-icon channel-icon__archive'/>
                                )}
                                <FormattedMessage
                                    id={archiveBtnID}
                                    defaultMessage={archiveBtnDefault}
                                />
                            </button>
                            }
                        </OverlayTrigger>
                    </div>
                </div>
            </div>

        </AdminPanel>
    );
}

TeamProfile.propTypes = {
    team: PropTypes.object.isRequired,
    onToggleArchive: PropTypes.func,
    isArchived: PropTypes.bool.isRequired,
    isDisabled: PropTypes.bool,
};
