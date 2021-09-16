// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Tooltip} from 'react-bootstrap';
import {FormattedMessage} from 'react-intl';
import styled from 'styled-components';

import Icon from '@mattermost/compass-components/foundations/icon';

import {Posts} from 'mattermost-redux/constants';
import {Post} from 'mattermost-redux/types/posts';
import {Theme} from 'mattermost-redux/types/themes';
import {UserProfile, UserProfileWithLastViewAt} from 'mattermost-redux/types/users';

import PostMarkdown from 'components/post_markdown';
import OverlayTrigger from 'components/overlay_trigger';
import ShowMore from 'components/post_view/show_more';
import {AttachmentTextOverflowType} from 'components/post_view/show_more/show_more';
import Pluggable from 'plugins/pluggable';

import Constants from 'utils/constants';
import * as PostUtils from 'utils/post_utils';
import {TextFormattingOptions} from 'utils/text_formatting';
import * as Utils from 'utils/utils';

type Props = {
    post: Post; /* The post to render the message for */
    enableFormatting?: boolean; /* Set to enable Markdown formatting */
    options?: TextFormattingOptions; /* Options specific to text formatting */
    compactDisplay?: boolean; /* Set to render post body compactly */
    isRHS?: boolean; /* Flags if the post_message_view is for the RHS (Reply). */
    isRHSOpen?: boolean; /* Whether or not the RHS is visible */
    isRHSExpanded?: boolean; /* Whether or not the RHS is expanded */
    theme: Theme; /* Logged in user's theme */
    pluginPostTypes?: any; /* Post type components from plugins */
    currentRelativeTeamUrl: string;
    overflowType?: AttachmentTextOverflowType;
    maxHeight?: number; /* The max height used by the show more component */
    teammate?: UserProfile;
    currentUser: UserProfile;
    profilesWithLastViewAtInChannel?: UserProfileWithLastViewAt[];
}

type State = {
    collapse: boolean;
    hasOverflow: boolean;
    checkOverflow: number;
}

const StyledIcon = styled(Icon)`
    color: var(--button-bg);
`;

export default class PostMessageView extends React.PureComponent<Props, State> {
    private imageProps: any;

    static defaultProps = {
        options: {},
        isRHS: false,
        pluginPostTypes: {},
        overflowType: undefined,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            collapse: true,
            hasOverflow: false,
            checkOverflow: 0,
        };

        this.imageProps = {
            onImageLoaded: this.handleHeightReceived,
            onImageHeightChanged: this.checkPostOverflow,
        };
    }

    checkPostOverflow = () => {
        // Increment checkOverflow to indicate change in height
        // and recompute textContainer height at ShowMore component
        // and see whether overflow text of show more/less is necessary or not.
        this.setState((prevState) => {
            return {checkOverflow: prevState.checkOverflow + 1};
        });
    }

    handleHeightReceived = (height: number) => {
        if (height > 0) {
            this.checkPostOverflow();
        }
    };

    renderDeletedPost() {
        return (
            <p>
                <FormattedMessage
                    id='post_body.deleted'
                    defaultMessage='(message deleted)'
                />
            </p>
        );
    }

    renderEditedIndicator() {
        if (!PostUtils.isEdited(this.props.post)) {
            return null;
        }

        return (
            <span
                id={`postEdited_${this.props.post.id}`}
                className='post-edited__indicator'
            >
                <FormattedMessage
                    id='post_message_view.edited'
                    defaultMessage='(edited)'
                />
            </span>
        );
    }

    renderSeenIndicator() {
        const {teammate, currentUser, profilesWithLastViewAtInChannel} = this.props;
        const teammateLastViewedAt = profilesWithLastViewAtInChannel?.find((profile) => profile.id === currentUser.id)?.last_viewed_at;

        if (teammate?.props?.local_enable_read_receipts === 'Off' || teammateLastViewedAt === 0) {
            return null;
        }

        const tooltip = (
            <Tooltip id='seenTooltip'>
                <FormattedMessage
                    id='channel_header.recentMentions'
                    defaultMessage='Seen'
                />
            </Tooltip>
        );

        return (
            <OverlayTrigger
                trigger={['hover']}
                delayShow={Constants.OVERLAY_TIME_DELAY}
                placement='bottom'
                overlay={tooltip}
            >
                <StyledIcon
                    size={12}
                    glyph={'check-all'}
                />
            </OverlayTrigger>
        );
    }

    handleFormattedTextClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        Utils.handleFormattedTextClick(e, this.props.currentRelativeTeamUrl);

    render() {
        const {
            post,
            enableFormatting,
            options,
            pluginPostTypes,
            compactDisplay,
            isRHS,
            theme,
            overflowType,
            maxHeight,
        } = this.props;

        if (post.state === Posts.POST_DELETED) {
            return this.renderDeletedPost();
        }

        if (!enableFormatting) {
            return <span>{post.message}</span>;
        }

        const postType = post.props && post.props.type ? post.props.type : post.type;

        if (pluginPostTypes && pluginPostTypes.hasOwnProperty(postType)) {
            const PluginComponent = pluginPostTypes[postType].component;
            return (
                <PluginComponent
                    post={post}
                    compactDisplay={compactDisplay}
                    isRHS={isRHS}
                    theme={theme}
                />
            );
        }

        let message = post.message;
        const isEphemeral = Utils.isPostEphemeral(post);
        if (compactDisplay && isEphemeral) {
            const visibleMessage = Utils.localizeMessage('post_info.message.visible.compact', ' (Only visible to you)');
            message = message.concat(visibleMessage);
        }

        const id = isRHS ? `rhsPostMessageText_${post.id}` : `postMessageText_${post.id}`;

        return (
            <ShowMore
                checkOverflow={this.state.checkOverflow}
                text={message}
                overflowType={overflowType}
                maxHeight={maxHeight}
            >
                <div
                    aria-readonly='true'
                    tabIndex={0}
                    id={id}
                    className='post-message__text'
                    dir='auto'
                    onClick={this.handleFormattedTextClick}
                >
                    <PostMarkdown
                        message={message}
                        imageProps={this.imageProps}
                        isRHS={isRHS}
                        options={options}
                        post={post}
                        channelId={post.channel_id}
                        mentionKeys={[]}
                    />
                </div>
                {this.renderSeenIndicator()}
                {this.renderEditedIndicator()}
                <Pluggable
                    pluggableName='PostMessageAttachment'
                    postId={post.id}
                    onHeightChange={this.handleHeightReceived}
                />
            </ShowMore>
        );
    }
}
